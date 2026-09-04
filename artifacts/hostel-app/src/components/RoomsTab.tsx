import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useListRooms,
  useGetRoomStats,
  useAssignBed,
  useVacateBed,
  useTransferBed,
  useCreateRoom,
  useListRegistrations,
  getListRoomsQueryKey,
  getGetRoomStatsQueryKey,
  getListRegistrationsQueryKey,
} from "@workspace/api-client-react";
import type { RoomWithBeds, BedWithTenant } from "@workspace/api-client-react";
import { resolveUploadUrl } from "@/lib/utils";
import WhatsAppReminderDialog, { WhatsAppIcon } from "./WhatsAppReminderDialog";
import {
  Building2, BedDouble, Users, BarChart3, Plus, Search,
  UserCheck, ArrowRightLeft, DoorOpen, Loader2, RefreshCw,
} from "lucide-react";

type BedTarget = {
  bedId: number;
  bedNumber: number;
  roomId: number;
  roomNumber: number;
  tenant: BedWithTenant["tenant"];
};

function OccupancyBar({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? (occupied / total) * 100 : 0;
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BedCell({ bed, roomNumber, onClick }: { bed: BedWithTenant; roomNumber: number; onClick: (b: BedWithTenant) => void }) {
  const occupied = bed.status === "occupied";
  return (
    <button
      onClick={() => onClick(bed)}
      title={occupied ? `Bed ${bed.bedNumber} — ${bed.tenant?.fullName ?? "Occupied"}` : `Bed ${bed.bedNumber} — Vacant`}
      className={`relative group flex flex-col items-center justify-center rounded-lg border-2 p-1.5 min-w-[44px] transition-all hover:scale-105 active:scale-95 ${
        occupied
          ? "bg-primary/10 border-primary/40 hover:border-primary"
          : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-700/40 hover:border-emerald-500"
      }`}
    >
      <span className="text-[10px] font-bold text-muted-foreground leading-none mb-0.5">{bed.bedNumber}</span>
      <div className={`w-5 h-5 rounded-sm ${occupied ? "bg-primary/30" : "bg-emerald-400/40"}`} />
      {occupied && bed.tenant && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border text-foreground text-[10px] font-medium px-2 py-1 rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {bed.tenant.fullName}
        </div>
      )}
    </button>
  );
}

function RoomCard({ room, onBedClick }: { room: RoomWithBeds; onBedClick: (bed: BedWithTenant, room: RoomWithBeds) => void }) {
  const pct = room.totalBeds > 0 ? Math.round((room.occupiedBeds / room.totalBeds) * 100) : 0;
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Room {room.roomNumber}</p>
              <p className="text-xs text-muted-foreground">{room.totalBeds} beds</p>
            </div>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          pct >= 90
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : pct >= 50
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        }`}>
          {pct}% full
        </span>
      </div>

      <OccupancyBar occupied={room.occupiedBeds} total={room.totalBeds} />

      <div className="flex justify-between text-xs text-muted-foreground mt-1.5 mb-3">
        <span><span className="font-semibold text-foreground">{room.occupiedBeds}</span> occupied</span>
        <span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{room.availableBeds}</span> free</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {room.beds.map((bed) => (
          <BedCell key={bed.id} bed={bed} roomNumber={room.roomNumber} onClick={(b) => onBedClick(b, room)} />
        ))}
      </div>
    </div>
  );
}

export default function RoomsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading: roomsLoading, refetch } = useListRooms({
    query: { queryKey: getListRoomsQueryKey(), refetchInterval: 60000 },
  });
  const { data: stats, isLoading: statsLoading } = useGetRoomStats({
    query: { queryKey: getGetRoomStatsQueryKey(), refetchInterval: 60000 },
  });
  const { data: allRegs } = useListRegistrations(
    { status: "approved", limit: 200 },
    { query: { queryKey: getListRegistrationsQueryKey({ status: "approved", limit: 200 }) } }
  );

  const assignBed = useAssignBed();
  const vacateBed = useVacateBed();
  const transferBed = useTransferBed();
  const createRoom = useCreateRoom();

  const [bedTarget, setBedTarget] = useState<BedTarget | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [newBedId, setNewBedId] = useState<number | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newTotalBeds, setNewTotalBeds] = useState("");
  const [waTenantTarget, setWaTenantTarget] = useState<{ fullName: string; mobileNumber: string } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRoomStatsQueryKey() });
  };

  const unassignedTenants = (allRegs?.data ?? []).filter((r) => r.bedId === null);
  const filteredTenants = unassignedTenants.filter(
    (t) =>
      t.fullName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.mobileNumber.includes(tenantSearch)
  );

  const allVacantBeds = (rooms ?? []).flatMap((r) =>
    r.beds
      .filter((b) => b.status === "vacant")
      .map((b) => ({ ...b, roomNumber: r.roomNumber }))
  );

  const handleBedClick = (bed: BedWithTenant, room: RoomWithBeds) => {
    setBedTarget({
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      tenant: bed.tenant,
    });
    if (bed.status === "vacant") {
      setShowAssign(true);
      setSelectedTenantId(null);
      setTenantSearch("");
      setJoiningDate(new Date().toISOString().split("T")[0]);
    } else {
      setShowTransfer(false);
    }
  };

  const handleAssign = () => {
    if (!bedTarget || !selectedTenantId) return;
    assignBed.mutate(
      { bedId: bedTarget.bedId, data: { tenantId: selectedTenantId, joiningDate } },
      {
        onSuccess: () => {
          toast({ title: "Tenant assigned", description: `Bed ${bedTarget.bedNumber} (Room ${bedTarget.roomNumber}) assigned successfully.` });
          invalidate();
          setShowAssign(false);
          setBedTarget(null);
        },
        onError: (e: unknown) => {
          const err = e as { data?: { error?: string } };
          toast({ title: "Assignment failed", description: err?.data?.error ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleVacate = () => {
    if (!bedTarget) return;
    vacateBed.mutate(
      { bedId: bedTarget.bedId },
      {
        onSuccess: () => {
          toast({ title: "Bed vacated", description: `Bed ${bedTarget.bedNumber} (Room ${bedTarget.roomNumber}) is now vacant.` });
          invalidate();
          queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
          setBedTarget(null);
        },
        onError: () => toast({ title: "Error", description: "Failed to vacate bed.", variant: "destructive" }),
      }
    );
  };

  const handleTransfer = () => {
    if (!bedTarget || !newBedId) return;
    transferBed.mutate(
      { bedId: bedTarget.bedId, data: { newBedId } },
      {
        onSuccess: () => {
          toast({ title: "Tenant transferred", description: `Tenant moved to the new bed successfully.` });
          invalidate();
          queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
          setBedTarget(null);
          setShowTransfer(false);
          setNewBedId(null);
        },
        onError: (e: unknown) => {
          const err = e as { data?: { error?: string } };
          toast({ title: "Transfer failed", description: err?.data?.error ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleAddRoom = () => {
    const rn = parseInt(newRoomNumber);
    const tb = parseInt(newTotalBeds);
    if (isNaN(rn) || isNaN(tb) || rn < 1 || tb < 1) {
      toast({ title: "Invalid input", description: "Please enter valid room number and bed count.", variant: "destructive" });
      return;
    }
    createRoom.mutate(
      { data: { roomNumber: rn, totalBeds: tb } },
      {
        onSuccess: () => {
          toast({ title: "Room added", description: `Room ${rn} with ${tb} beds has been created.` });
          invalidate();
          setShowAddRoom(false);
          setNewRoomNumber("");
          setNewTotalBeds("");
        },
        onError: (e: unknown) => {
          const err = e as { data?: { error?: string } };
          toast({ title: "Failed to add room", description: err?.data?.error ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Occupancy Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Rooms", value: stats?.totalRooms ?? 0, icon: Building2, color: "text-primary bg-primary/10" },
          { label: "Total Beds", value: stats?.totalBeds ?? 0, icon: BedDouble, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Occupied", value: stats?.occupiedBeds ?? 0, icon: Users, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" },
          { label: "Vacant", value: stats?.vacantBeds ?? 0, icon: DoorOpen, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "Occupancy", value: `${stats?.occupancyPercentage ?? 0}%`, icon: BarChart3, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 w-12 bg-muted rounded mb-1.5" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ) : (
              <>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-400/40 border border-emerald-400/60" />
            Vacant — click to assign
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/40" />
            Occupied — click to manage
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" className="rounded-lg" onClick={() => setShowAddRoom(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Room
          </Button>
        </div>
      </div>

      {/* Rooms Grid */}
      {roomsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-2xl p-4 animate-pulse h-44" />
          ))}
        </div>
      ) : (rooms ?? []).length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Room" to create the first room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(rooms ?? []).map((room) => (
            <RoomCard key={room.id} room={room} onBedClick={handleBedClick} />
          ))}
        </div>
      )}

      {/* Assign Tenant Dialog */}
      <Dialog open={showAssign} onOpenChange={(o) => { setShowAssign(o); if (!o) setBedTarget(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Assign Tenant — Bed {bedTarget?.bedNumber}, Room {bedTarget?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Joining Date</Label>
              <Input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">Next payment date auto-calculated one month after joining</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Select Approved Tenant</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-8 rounded-lg text-sm"
                />
              </div>

              {filteredTenants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {unassignedTenants.length === 0
                    ? "No approved tenants without a bed assignment"
                    : "No tenants match your search"}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {filteredTenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => setSelectedTenantId(tenant.id === selectedTenantId ? null : tenant.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border-2 transition-all ${
                        selectedTenantId === tenant.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 bg-card"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {tenant.photoUrl ? (
                          <img src={resolveUploadUrl(tenant.photoUrl)} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-primary text-sm font-semibold">{tenant.fullName[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{tenant.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tenant.mobileNumber}</p>
                        {tenant.profession && (
                          <p className="text-xs text-muted-foreground">{tenant.profession}</p>
                        )}
                      </div>
                      {selectedTenantId === tenant.id && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full rounded-xl"
              disabled={!selectedTenantId || assignBed.isPending}
              onClick={handleAssign}
            >
              {assignBed.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...</>
              ) : (
                "Assign Tenant to Bed"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bed Management Dialog (occupied bed) */}
      <Dialog open={!!bedTarget && !showAssign} onOpenChange={(o) => { if (!o) { setBedTarget(null); setShowTransfer(false); setNewBedId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Bed {bedTarget?.bedNumber} — Room {bedTarget?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          {bedTarget?.tenant && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">{bedTarget.tenant.fullName[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{bedTarget.tenant.fullName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{bedTarget.tenant.mobileNumber}</p>
                  {bedTarget.tenant.joiningDate && (
                    <p className="text-xs text-muted-foreground">
                      Joined: {new Date(bedTarget.tenant.joiningDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {!showTransfer ? (
                <div className="space-y-2">
                  <Button
                    className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 font-medium"
                    onClick={() => {
                      if (bedTarget?.tenant) {
                        setWaTenantTarget({
                          fullName: bedTarget.tenant.fullName,
                          mobileNumber: bedTarget.tenant.mobileNumber,
                        });
                      }
                    }}
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white" /> Send WhatsApp Due Reminder
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={handleVacate}
                    disabled={vacateBed.isPending}
                  >
                    {vacateBed.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vacating...</>
                    ) : (
                      <><DoorOpen className="w-4 h-4 mr-2" /> Vacate Bed</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => setShowTransfer(true)}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer to Another Bed
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Select destination bed:</p>
                  {allVacantBeds.filter((b) => b.id !== bedTarget.bedId).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No vacant beds available for transfer.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {allVacantBeds
                        .filter((b) => b.id !== bedTarget.bedId)
                        .map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setNewBedId(b.id === newBedId ? null : b.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                              newBedId === b.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            }`}
                          >
                            <span className="text-sm font-medium text-foreground">Room {b.roomNumber} — Bed {b.bedNumber}</span>
                            {newBedId === b.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                          </button>
                        ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowTransfer(false); setNewBedId(null); }}>
                      Back
                    </Button>
                    <Button
                      className="flex-1 rounded-xl"
                      disabled={!newBedId || transferBed.isPending}
                      onClick={handleTransfer}
                    >
                      {transferBed.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Moving...</>
                      ) : (
                        "Transfer"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-serif">Add New Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Room Number</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 8"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Total Beds</Label>
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="e.g. 4"
                value={newTotalBeds}
                onChange={(e) => setNewTotalBeds(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={createRoom.isPending || !newRoomNumber || !newTotalBeds}
              onClick={handleAddRoom}
            >
              {createRoom.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Reminder Dialog */}
      <WhatsAppReminderDialog
        open={!!waTenantTarget}
        onOpenChange={(o) => !o && setWaTenantTarget(null)}
        tenant={waTenantTarget}
      />
    </div>
  );
}
