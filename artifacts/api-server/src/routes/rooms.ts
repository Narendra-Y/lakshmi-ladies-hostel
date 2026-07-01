import { Router, type IRouter } from "express";
import { db, roomsTable, bedsTable, registrationsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  ListRoomsResponse,
  CreateRoomBody,
  GetRoomStatsResponse,
  GetRoomParams,
  GetRoomResponse,
  AssignBedParams,
  AssignBedBody,
  AssignBedResponse,
  VacateBedParams,
  VacateBedResponse,
  TransferBedParams,
  TransferBedBody,
  TransferBedResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const PRESET_ROOMS = [
  { roomNumber: 1, totalBeds: 5 },
  { roomNumber: 2, totalBeds: 6 },
  { roomNumber: 3, totalBeds: 3 },
  { roomNumber: 4, totalBeds: 4 },
  { roomNumber: 5, totalBeds: 5 },
  { roomNumber: 6, totalBeds: 2 },
  { roomNumber: 7, totalBeds: 6 },
];

async function seedRooms() {
  const existing = await db.select({ id: roomsTable.id }).from(roomsTable).limit(1);
  if (existing.length > 0) return;
  for (const preset of PRESET_ROOMS) {
    const [room] = await db.insert(roomsTable).values(preset).returning();
    const beds = Array.from({ length: preset.totalBeds }, (_, i) => ({
      roomId: room.id,
      bedNumber: i + 1,
      status: "vacant" as const,
    }));
    await db.insert(bedsTable).values(beds);
  }
}

seedRooms().catch((err) => {
  console.error("Room seeding failed:", err);
});

type RoomRow = {
  id: number;
  roomNumber: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  beds: BedRow[];
};

type BedRow = {
  id: number;
  roomId: number;
  bedNumber: number;
  status: string;
  tenant: TenantRow | null;
};

type TenantRow = {
  id: number;
  fullName: string;
  mobileNumber: string;
  email: string | null;
  joiningDate: string | null;
  nextPaymentDate: string | null;
  paymentStatus: string | null;
};

async function fetchAllRooms(): Promise<RoomRow[]> {
  const rows = await db
    .select({
      roomId: roomsTable.id,
      roomNumber: roomsTable.roomNumber,
      totalBeds: roomsTable.totalBeds,
      bedId: bedsTable.id,
      bedNumber: bedsTable.bedNumber,
      bedStatus: bedsTable.status,
      tenantId: registrationsTable.id,
      fullName: registrationsTable.fullName,
      mobileNumber: registrationsTable.mobileNumber,
      email: registrationsTable.email,
      joiningDate: registrationsTable.joiningDate,
      nextPaymentDate: registrationsTable.nextPaymentDate,
      paymentStatus: registrationsTable.paymentStatus,
    })
    .from(roomsTable)
    .leftJoin(bedsTable, eq(bedsTable.roomId, roomsTable.id))
    .leftJoin(registrationsTable, eq(bedsTable.tenantId, registrationsTable.id))
    .orderBy(roomsTable.roomNumber, bedsTable.bedNumber);

  const roomMap = new Map<number, RoomRow>();

  for (const row of rows) {
    if (!roomMap.has(row.roomId)) {
      roomMap.set(row.roomId, {
        id: row.roomId,
        roomNumber: row.roomNumber,
        totalBeds: row.totalBeds,
        occupiedBeds: 0,
        availableBeds: 0,
        beds: [],
      });
    }
    const room = roomMap.get(row.roomId)!;
    if (row.bedId !== null) {
      const tenant: TenantRow | null =
        row.tenantId !== null
          ? {
              id: row.tenantId,
              fullName: row.fullName!,
              mobileNumber: row.mobileNumber!,
              email: row.email ?? null,
              joiningDate: row.joiningDate ?? null,
              nextPaymentDate: row.nextPaymentDate ?? null,
              paymentStatus: row.paymentStatus ?? null,
            }
          : null;

      room.beds.push({
        id: row.bedId,
        roomId: row.roomId,
        bedNumber: row.bedNumber!,
        status: row.bedStatus!,
        tenant,
      });

      if (row.bedStatus === "occupied") room.occupiedBeds++;
    }
  }

  for (const room of roomMap.values()) {
    room.availableBeds = room.totalBeds - room.occupiedBeds;
  }

  return Array.from(roomMap.values()).sort((a, b) => a.roomNumber - b.roomNumber);
}

router.get("/rooms/stats", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const rooms = await fetchAllRooms();
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
  res.json(
    GetRoomStatsResponse.parse({
      totalRooms: rooms.length,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    })
  );
});

router.get("/rooms", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const rooms = await fetchAllRooms();
  res.json(ListRoomsResponse.parse(rooms));
});

router.post("/rooms", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: roomsTable.id })
    .from(roomsTable)
    .where(eq(roomsTable.roomNumber, parsed.data.roomNumber));
  if (existing.length > 0) {
    res.status(409).json({ error: "Room number already exists" });
    return;
  }

  const [room] = await db
    .insert(roomsTable)
    .values({ roomNumber: parsed.data.roomNumber, totalBeds: parsed.data.totalBeds })
    .returning();

  const beds = Array.from({ length: parsed.data.totalBeds }, (_, i) => ({
    roomId: room.id,
    bedNumber: i + 1,
    status: "vacant" as const,
  }));
  await db.insert(bedsTable).values(beds);

  const rooms = await fetchAllRooms();
  const newRoom = rooms.find((r) => r.id === room.id);
  res.status(201).json(newRoom);
});

router.get("/rooms/:roomId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const params = GetRoomParams.safeParse({ roomId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rooms = await fetchAllRooms();
  const room = rooms.find((r) => r.id === params.data.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(GetRoomResponse.parse(room));
});

router.patch("/rooms/beds/:bedId/assign", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.bedId) ? req.params.bedId[0] : req.params.bedId;
  const params = AssignBedParams.safeParse({ bedId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = AssignBedBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [bed] = await db
    .select()
    .from(bedsTable)
    .where(eq(bedsTable.id, params.data.bedId));
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }
  if (bed.status === "occupied") {
    res.status(409).json({ error: "Bed is already occupied" });
    return;
  }

  const [tenant] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.id, bodyParsed.data.tenantId));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  if (tenant.bedId !== null) {
    res.status(409).json({ error: "Tenant is already assigned to a bed" });
    return;
  }

  const joiningDate = bodyParsed.data.joiningDate instanceof Date
    ? bodyParsed.data.joiningDate.toISOString().split("T")[0]
    : bodyParsed.data.joiningDate ?? new Date().toISOString().split("T")[0];

  const joinDate = new Date(joiningDate);
  const nextPayment = new Date(joinDate);
  nextPayment.setMonth(nextPayment.getMonth() + 1);
  const nextPaymentDate = nextPayment.toISOString().split("T")[0];

  await db
    .update(bedsTable)
    .set({ status: "occupied", tenantId: tenant.id })
    .where(eq(bedsTable.id, params.data.bedId));

  await db
    .update(registrationsTable)
    .set({
      roomId: bed.roomId,
      bedId: bed.id,
      joiningDate,
      nextPaymentDate,
      paymentStatus: "pending",
    })
    .where(eq(registrationsTable.id, tenant.id));

  const rooms = await fetchAllRooms();
  const updatedRoom = rooms.find((r) => r.id === bed.roomId);
  const updatedBed = updatedRoom?.beds.find((b) => b.id === params.data.bedId);
  res.json(AssignBedResponse.parse(updatedBed));
});

router.patch("/rooms/beds/:bedId/vacate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.bedId) ? req.params.bedId[0] : req.params.bedId;
  const params = VacateBedParams.safeParse({ bedId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bed] = await db
    .select()
    .from(bedsTable)
    .where(eq(bedsTable.id, params.data.bedId));
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  if (bed.tenantId !== null) {
    await db
      .update(registrationsTable)
      .set({ roomId: null, bedId: null, joiningDate: null, nextPaymentDate: null, paymentStatus: null })
      .where(eq(registrationsTable.id, bed.tenantId));
  }

  await db
    .update(bedsTable)
    .set({ status: "vacant", tenantId: null })
    .where(eq(bedsTable.id, params.data.bedId));

  const rooms = await fetchAllRooms();
  const updatedRoom = rooms.find((r) => r.id === bed.roomId);
  const updatedBed = updatedRoom?.beds.find((b) => b.id === params.data.bedId);
  res.json(VacateBedResponse.parse(updatedBed));
});

router.patch("/rooms/beds/:bedId/transfer", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.bedId) ? req.params.bedId[0] : req.params.bedId;
  const params = TransferBedParams.safeParse({ bedId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = TransferBedBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [sourceBed] = await db
    .select()
    .from(bedsTable)
    .where(eq(bedsTable.id, params.data.bedId));
  if (!sourceBed) {
    res.status(404).json({ error: "Source bed not found" });
    return;
  }
  if (sourceBed.status !== "occupied" || sourceBed.tenantId === null) {
    res.status(400).json({ error: "Source bed is not occupied" });
    return;
  }

  const [destBed] = await db
    .select()
    .from(bedsTable)
    .where(eq(bedsTable.id, bodyParsed.data.newBedId));
  if (!destBed) {
    res.status(404).json({ error: "Destination bed not found" });
    return;
  }
  if (destBed.status === "occupied") {
    res.status(409).json({ error: "Destination bed is already occupied" });
    return;
  }

  const tenantId = sourceBed.tenantId;

  await db
    .update(bedsTable)
    .set({ status: "vacant", tenantId: null })
    .where(eq(bedsTable.id, sourceBed.id));

  await db
    .update(bedsTable)
    .set({ status: "occupied", tenantId })
    .where(eq(bedsTable.id, destBed.id));

  await db
    .update(registrationsTable)
    .set({ roomId: destBed.roomId, bedId: destBed.id })
    .where(eq(registrationsTable.id, tenantId));

  const rooms = await fetchAllRooms();
  const updatedRoom = rooms.find((r) => r.id === destBed.roomId);
  const updatedBed = updatedRoom?.beds.find((b) => b.id === destBed.id);
  res.json(TransferBedResponse.parse(updatedBed));
});

export default router;
