import { useState, useMemo } from 'react';
import {
  useSeats,
  useBulkCreateSeats,
  useCreateSingleSeat,
  useUpdateSeat,
  useDeleteSeat,
  useDeleteSeatsBySection,
  useUpdateSeatStatus,
  useShifts,
  usePlans,
  useChangeSeat,
} from '../hooks/useLibrary';
import { useStudents, useCreateMembership, useVacateSeat } from '../hooks/useStudents';
import { useAuth } from '../hooks/useAuth';
import type { SeatDTO, SeatStatus } from '@atlas/shared';
import { CustomSelect, Modal, ConfirmModal } from '../components/ui';
import {
  Layers,
  Clock,
  ArrowRightLeft,
  UserMinus,
  MessageSquare,
  Wrench,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DateRangeDurationSelector,
  calculateEndDateFromDays,
  getTodayDateString,
  type DurationOption,
} from '../components/DateRangeDurationSelector';
import { formatDate } from '../utils/date';
import { renderWhatsAppReminder, openWhatsAppChat } from '../utils/whatsapp';

export function SeatsPage() {
  const { user } = useAuth();
  // Query parameters / Filter states
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SeatStatus>('all');
  const [searchDesk, setSearchDesk] = useState<string>('');

  // Queries
  const { data: shifts = [] } = useShifts();
  const { data: plans = [] } = usePlans();
  const { data: students = [] } = useStudents();
  
  // Notice: We fetch all seats without passing section to backend so that all section tabs, counts, and switching remain 100% instant and accurate
  const { data: allSeats = [], isLoading } = useSeats({
    shiftId: selectedShiftId,
  });

  // Mutations
  const bulkCreate = useBulkCreateSeats();
  const createSingleSeatMutation = useCreateSingleSeat();
  const updateSeatMutation = useUpdateSeat();
  const deleteSeatMutation = useDeleteSeat();
  const deleteSeatsBySectionMutation = useDeleteSeatsBySection();
  const updateStatus = useUpdateSeatStatus();
  const changeSeatMutation = useChangeSeat();
  const createMembershipMutation = useCreateMembership();
  const vacateSeatMutation = useVacateSeat();

  // Generator form
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(50);
  const [prefix, setPrefix] = useState('');
  const [newSection, setNewSection] = useState('Main Hall');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single Seat Add Modal
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [singleSeatNumber, setSingleSeatNumber] = useState('');
  const [singleSection, setSingleSection] = useState('Main Hall');

  // Edit Seat Modal
  const [editSeatModal, setEditSeatModal] = useState<SeatDTO | null>(null);
  const [editSeatNumber, setEditSeatNumber] = useState('');
  const [editSection, setEditSection] = useState('');

  // Drawer / Details Modal State
  const [selectedSeat, setSelectedSeat] = useState<SeatDTO | null>(null);

  // Generic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
    action: () => {},
  });

  // Assign Student Modal
  const [assignStudentModal, setAssignStudentModal] = useState<SeatDTO | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<string>('');
  const [assignPlanId, setAssignPlanId] = useState<string>('');
  const [assignShiftId, setAssignShiftId] = useState<string>('');
  const [assignDurationOption, setAssignDurationOption] = useState<DurationOption>('30d');
  const [assignStartDate, setAssignStartDate] = useState<string>(() => getTodayDateString());
  const [assignEndDate, setAssignEndDate] = useState<string>(() =>
    calculateEndDateFromDays(getTodayDateString(), 30),
  );

  // Swap / Change Seat Modal
  const [swapModalData, setSwapModalData] = useState<{
    membershipId: string;
    studentName: string;
    currentSeatNumber: string;
  } | null>(null);
  const [targetSeatId, setTargetSeatId] = useState<string>('');

  // Extract distinct sections and their desk counts from all loaded seats
  const { sections, sectionCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const set = new Set<string>();
    allSeats.forEach((s) => {
      const sec = s.section?.trim() || 'Main Hall';
      set.add(sec);
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return {
      sections: Array.from(set).sort((a, b) => a.localeCompare(b)),
      sectionCounts: counts,
    };
  }, [allSeats]);

  // Client-side section filter, status filter, and search
  const displayedSeats = useMemo(() => {
    return allSeats.filter((s) => {
      // 1. Hall / Section Filter
      if (selectedSection !== 'all') {
        const sec = s.section?.trim() || 'Main Hall';
        if (sec.toLowerCase() !== selectedSection.toLowerCase()) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // 3. Desk or Student Search
      if (searchDesk.trim()) {
        const query = searchDesk.trim().toLowerCase();
        const matchesDesk = s.seatNumber.toLowerCase().includes(query);
        const matchesStudent = s.occupant?.name?.toLowerCase().includes(query);
        const matchesMobile = s.occupant?.mobile?.includes(query);
        return matchesDesk || matchesStudent || matchesMobile;
      }
      return true;
    });
  }, [allSeats, selectedSection, statusFilter, searchDesk]);

  // Overall statistics for live KPI bar (reflects current section if selected)
  const stats = useMemo(() => {
    const list = selectedSection === 'all'
      ? allSeats
      : allSeats.filter((s) => (s.section?.trim() || 'Main Hall').toLowerCase() === selectedSection.toLowerCase());

    const total = list.length;
    const occupied = list.filter((s) => s.status === 'occupied').length;
    const available = list.filter((s) => s.status === 'available').length;
    const maintenance = list.filter((s) => s.status === 'maintenance' || s.status === 'blocked').length;
    const dueCount = list.filter((s) => s.occupant?.hasDues).length;
    const expiringSoon = list.filter((s) => s.occupant && s.occupant.daysRemaining <= 3).length;
    return { total, occupied, available, maintenance, dueCount, expiringSoon };
  }, [allSeats, selectedSection]);

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkCreate.mutate(
      { startNumber: Number(startNum), endNumber: Number(endNum), prefix, section: newSection.trim() || 'Main Hall' },
      {
        onSuccess: () => {
          setShowBulkModal(false);
        },
      },
    );
  };

  const handleCreateSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleSeatNumber.trim()) return;
    createSingleSeatMutation.mutate(
      { seatNumber: singleSeatNumber.trim(), section: singleSection.trim() || 'Main Hall' },
      {
        onSuccess: () => {
          setShowAddSingleModal(false);
          setSingleSeatNumber('');
        },
      },
    );
  };

  const handleOpenEdit = (seat: SeatDTO) => {
    setEditSeatModal(seat);
    setEditSeatNumber(seat.seatNumber);
    setEditSection(seat.section?.trim() || 'Main Hall');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSeatModal || !editSeatNumber.trim()) return;
    updateSeatMutation.mutate(
      {
        id: editSeatModal._id,
        seatNumber: editSeatNumber.trim(),
        section: editSection.trim() || 'Main Hall',
      },
      {
        onSuccess: (updated) => {
          setEditSeatModal(null);
          if (selectedSeat && selectedSeat._id === updated._id) {
            setSelectedSeat((prev) => (prev ? { ...prev, seatNumber: updated.seatNumber, section: updated.section } : null));
          }
        },
      },
    );
  };

  const handleDeleteSeat = (seat: SeatDTO) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Desk ${seat.seatNumber}`,
      description: `Are you sure you want to delete desk '${seat.seatNumber}'? If a student is assigned to this desk, deletion will be safely rejected.`,
      confirmLabel: 'Delete Desk',
      variant: 'danger',
      action: () => {
        deleteSeatMutation.mutate(seat._id, {
          onSuccess: () => {
            setSelectedSeat(null);
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          },
        });
      },
    });
  };

  const handleDeleteCurrentSection = (sectionName: string) => {
    const count = sectionCounts[sectionName] || 0;
    setConfirmConfig({
      isOpen: true,
      title: `Delete Section "${sectionName}"`,
      description: `CAUTION: Are you sure you want to delete all ${count} desks in section '${sectionName}'? Desks with active students will prevent deletion.`,
      confirmLabel: `Delete All ${count} Desks`,
      variant: 'danger',
      action: () => {
        deleteSeatsBySectionMutation.mutate(sectionName, {
          onSuccess: () => {
            setSelectedSection('all');
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          },
        });
      },
    });
  };

  const handleToggleMaintenance = (seat: SeatDTO) => {
    const nextStatus: SeatStatus = seat.status === 'maintenance' ? 'available' : 'maintenance';
    updateStatus.mutate(
      { id: seat._id, status: nextStatus },
      {
        onSuccess: (updated) => {
          if (selectedSeat && selectedSeat._id === seat._id) {
            setSelectedSeat((prev) => (prev ? { ...prev, status: updated.status } : null));
          }
        },
      },
    );
  };

  const handleOpenAssign = (seat: SeatDTO) => {
    setAssignStudentModal(seat);
    setAssignShiftId(selectedShiftId !== 'all' ? selectedShiftId : shifts[0]?._id || '');
    setAssignPlanId(plans[0]?._id || '');
    setAssignStudentId(students[0]?._id || '');
    setAssignDurationOption('30d');
    const today = getTodayDateString();
    setAssignStartDate(today);
    setAssignEndDate(calculateEndDateFromDays(today, 30));
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentModal || !assignStudentId || !assignPlanId) return;

    createMembershipMutation.mutate(
      {
        studentId: assignStudentId,
        planId: assignPlanId,
        shiftId: assignShiftId || undefined,
        seatId: assignStudentModal._id,
        startDate: assignStartDate,
        endDate: assignEndDate,
      },
      {
        onSuccess: () => {
          setAssignStudentModal(null);
          setSelectedSeat(null);
        },
      },
    );
  };

  const handleConfirmSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapModalData || !targetSeatId) return;

    changeSeatMutation.mutate(
      {
        membershipId: swapModalData.membershipId,
        targetSeatId,
      },
      {
        onSuccess: () => {
          setSwapModalData(null);
          setSelectedSeat(null);
        },
      },
    );
  };

  const handleVacateSeat = (membershipId: string, studentId: string, seatNumber: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Vacate Desk ${seatNumber}`,
      description: `Are you sure you want to vacate desk ${seatNumber}? The desk will become available immediately for other students. The student's membership will remain active (floating) until explicitly marked as Left.`,
      confirmLabel: 'Vacate Desk',
      variant: 'warning',
      action: () => {
        vacateSeatMutation.mutate(
          { membershipId, studentId },
          {
            onSuccess: () => {
              setSelectedSeat(null);
              setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
            },
          },
        );
      },
    });
  };

  const handleWhatsApp = (mobile: string, studentName: string, seatNumber: string) => {
    const text = renderWhatsAppReminder(user?.whatsappReminderTemplate, {
      studentName,
      seatNumber,
      libraryName: user?.tenantName || 'StudySpace Library',
      phone: user?.phone || '',
    });
    openWhatsAppChat(mobile, text);
  };

  // Color generator for seat grid items
  const getSeatCardClasses = (seat: SeatDTO) => {
    if (seat.status === 'maintenance' || seat.status === 'blocked') {
      return 'border-amber-400/50 bg-amber-500/10 text-amber-300 hover:border-amber-400 dark:bg-amber-950/20';
    }
    if (seat.status === 'occupied') {
      if (seat.occupant?.hasDues) {
        return 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:border-rose-400 dark:bg-rose-950/20';
      }
      if (seat.occupant && seat.occupant.daysRemaining <= 3) {
        return 'border-orange-500/50 bg-orange-500/10 text-orange-300 hover:border-orange-400 dark:bg-orange-950/20';
      }
      return 'border-blue-500/50 bg-blue-500/10 text-blue-300 hover:border-blue-400 dark:bg-blue-950/20';
    }
    // Available
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400 dark:bg-emerald-950/20';
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live Visual Seating Map</h1>
            <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 border border-emerald-500/30 font-medium">
              Multi-Shift Aware
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time shift-wise desk allocation, instant student reception drawer, and 1-click desk swap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSingleSection(selectedSection !== 'all' ? selectedSection : 'Main Hall');
              setShowAddSingleModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            Add Single Desk
          </button>
          <button
            onClick={() => {
              setNewSection(selectedSection !== 'all' ? selectedSection : 'Main Hall');
              setShowBulkModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold !text-white shadow hover:bg-indigo-500 transition"
          >
            <Layers className="h-4 w-4" />
            + Bulk Generate Desks
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {selectedSection !== 'all' ? `${selectedSection} Total` : 'Total Desks'}
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.available}</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Occupied</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.occupied}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Maintenance</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.maintenance}</div>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Fee Overdue</div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.dueCount}</div>
        </div>
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3.5 shadow-sm">
          <div className="text-[11px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">Expiring ≤ 3d</div>
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.expiringSoon}</div>
        </div>
      </div>

      {/* Control Bar: Shifts Chip Selector + Section Tabs + Search + Legend */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
        {/* Row 1: Shift Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
              <Clock className="h-3.5 w-3.5" /> Shift:
            </span>
            <button
              onClick={() => setSelectedShiftId('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition shrink-0 ${
                selectedShiftId === 'all'
                  ? 'bg-indigo-600 !text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Shifts (Overview)
            </button>
            {shifts.map((s) => (
              <button
                key={s._id}
                onClick={() => setSelectedShiftId(s._id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                  selectedShiftId === s._id
                    ? 'bg-indigo-600 !text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] opacity-75">({s.startTime} - {s.endTime})</span>
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchDesk}
              onChange={(e) => setSearchDesk(e.target.value)}
              placeholder="Search Desk # or Student…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Row 2: Section / Hall Filters & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Hall/Section:
            </span>
            <button
              onClick={() => setSelectedSection('all')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition flex items-center gap-1.5 ${
                selectedSection === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Sections</span>
              <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${selectedSection === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {allSeats.length}
              </span>
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedSection === sec
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{sec}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${selectedSection === sec ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {sectionCounts[sec] || 0}
                </span>
              </button>
            ))}

            {selectedSection !== 'all' && (
              <button
                type="button"
                onClick={() => handleDeleteCurrentSection(selectedSection)}
                title={`Delete entire section "${selectedSection}"`}
                className="ml-2 flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-400 hover:underline px-2 py-0.5"
              >
                <Trash2 className="h-3 w-3" /> Clear Section
              </button>
            )}
          </div>

          {/* Legend and Status Filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Vacant</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Fee Due</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-400">Maintenance</span>
              </div>
            </div>

            <div className="w-36">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | SeatStatus)}
                options={[
                  { value: 'all', label: `All (${displayedSeats.length})` },
                  { value: 'available', label: 'Vacant Only' },
                  { value: 'occupied', label: 'Occupied Only' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 min-h-[420px] shadow-sm">
        {isLoading ? (
          <div className="flex h-56 flex-col items-center justify-center text-slate-400 text-sm gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading seating matrix…</span>
          </div>
        ) : displayedSeats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 space-y-3 text-center">
            <p className="text-slate-400 text-sm">
              {allSeats.length === 0
                ? 'No desks configured yet in your library.'
                : `No desks found in section "${selectedSection}".`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSingleSection(selectedSection !== 'all' ? selectedSection : 'Main Hall');
                  setShowAddSingleModal(true);
                }}
                className="text-xs text-indigo-500 hover:underline font-medium"
              >
                + Add a desk to this section
              </button>
              <span className="text-slate-400">•</span>
              <button
                onClick={() => {
                  setNewSection(selectedSection !== 'all' ? selectedSection : 'Main Hall');
                  setShowBulkModal(true);
                }}
                className="text-xs text-indigo-500 hover:underline font-medium"
              >
                Bulk generate desks
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
            {displayedSeats.map((seat) => {
              const isOccupied = seat.status === 'occupied';
              const isMaintenance = seat.status === 'maintenance' || seat.status === 'blocked';
              return (
                <button
                  key={seat._id}
                  onClick={() => setSelectedSeat(seat)}
                  className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer select-none hover:shadow-md hover:scale-[1.03] ${getSeatCardClasses(
                    seat,
                  )}`}
                >
                  {/* Top Badge: Desk # */}
                  <div className="text-xs font-bold leading-tight tracking-wide">{seat.seatNumber}</div>

                  {/* Center Content: Occupant name or status icon */}
                  <div className="my-1.5 min-h-[22px] flex items-center justify-center">
                    {isOccupied && seat.occupant ? (
                      <div className="text-[10px] font-medium truncate max-w-[70px] text-slate-700 dark:text-slate-200">
                        {seat.occupant.name.split(' ')[0]}
                      </div>
                    ) : isMaintenance ? (
                      <Wrench className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-emerald-500 opacity-80">
                        Vacant
                      </span>
                    )}
                  </div>

                  {/* Bottom: Days remaining badge or section */}
                  <div className="text-[9px] font-mono leading-tight">
                    {isOccupied && seat.occupant ? (
                      seat.occupant.hasDues ? (
                        <div className="flex flex-col items-center">
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold">Due</span>
                          <span className="text-[8px] text-slate-500 dark:text-slate-400 opacity-90 font-medium">
                            {seat.occupant.daysRemaining}d left
                          </span>
                        </div>
                      ) : (
                        <span className="opacity-80 text-slate-600 dark:text-slate-300">
                          {seat.occupant.daysRemaining}d left
                        </span>
                      )
                    ) : (
                      <span className="truncate max-w-[65px] opacity-75">{seat.section || 'Hall'}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 1-CLICK RECEPTION DESK DRAWER / MODAL ───────────────────────── */}
      <Modal
        isOpen={!!selectedSeat}
        onClose={() => setSelectedSeat(null)}
        title={selectedSeat ? `Desk ${selectedSeat.seatNumber}` : 'Desk Details'}
        subtitle={selectedSeat ? `${selectedSeat.section || 'Main Hall'} • Status: ${selectedSeat.status.toUpperCase()}` : ''}
        icon={<Layers className="h-5 w-5 text-indigo-500" />}
        maxWidth="lg"
      >
        {selectedSeat && (
          <div className="space-y-6">
            {/* Status Header Strip with Quick Edit / Delete */}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                selectedSeat.status === 'occupied'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : selectedSeat.status === 'maintenance'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-base">
                  {selectedSeat.seatNumber}
                </div>
                <div>
                  <div className="text-xs uppercase font-semibold opacity-75">
                    Section: {selectedSeat.section || 'Main Hall'}
                  </div>
                  <div className="text-sm font-bold capitalize">
                    {selectedSeat.status === 'occupied' ? 'Occupied' : selectedSeat.status}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedSeat)}
                  title="Edit Desk Number or Hall/Section"
                  className="flex items-center gap-1 rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Desk
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMaintenance(selectedSeat)}
                  className="flex items-center gap-1 rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {selectedSeat.status === 'maintenance' ? 'Mark Available' : 'Maintenance'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSeat(selectedSeat)}
                  title="Delete this desk"
                  className="flex items-center gap-1 rounded-lg border border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-2.5 py-1.5 text-xs font-semibold transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Occupant Details Card (If Occupied) */}
            {selectedSeat.occupant ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                      {selectedSeat.occupant.photoUrl ? (
                        <img
                          src={selectedSeat.occupant.photoUrl}
                          alt={selectedSeat.occupant.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        selectedSeat.occupant.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {selectedSeat.occupant.name}
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          ({selectedSeat.occupant.membershipNumber})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedSeat.occupant.mobile}</p>
                    </div>
                  </div>

                  <Link
                    to={`/students/${selectedSeat.occupant.studentId}`}
                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium"
                  >
                    Full Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {/* Membership validity & Dues info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Plan</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {selectedSeat.occupant.planName || 'General Plan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Shift</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {selectedSeat.occupant.shiftName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Days Remaining</span>
                    <span
                      className={`font-bold ${
                        selectedSeat.occupant.daysRemaining <= 3 ? 'text-orange-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedSeat.occupant.daysRemaining} days left
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Expiry Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(selectedSeat.occupant.endDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Fee Status</span>
                    {selectedSeat.occupant.hasDues ? (
                      <span className="font-bold text-rose-400">
                        ₹{(selectedSeat.occupant.duePaise / 100).toFixed(0)} Pending
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> All Paid
                      </span>
                    )}
                  </div>
                </div>

                {/* Reception Fast Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      handleWhatsApp(
                        selectedSeat.occupant!.mobile,
                        selectedSeat.occupant!.name,
                        selectedSeat.seatNumber,
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold !text-white shadow-sm transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSwapModalData({
                        membershipId: selectedSeat.occupant!.membershipId,
                        studentName: selectedSeat.occupant!.name,
                        currentSeatNumber: selectedSeat.seatNumber,
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold !text-white shadow-sm transition"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Change / Swap Desk
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleVacateSeat(
                        selectedSeat.occupant!.membershipId,
                        selectedSeat.occupant!.studentId,
                        selectedSeat.seatNumber,
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold transition"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Vacate Desk
                  </button>
                </div>
              </div>
            ) : (
              /* Vacant Desk Actions */
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Desk is Vacant</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ready to be assigned to a new or existing student.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAssign(selectedSeat)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold !text-white shadow transition"
                >
                  <PlusCircle className="h-4 w-4" /> + Assign Student to Desk {selectedSeat.seatNumber}
                </button>
              </div>
            )}

            {/* Multi-shift breakdown table if multiple shifts registered on this desk */}
            {selectedSeat.shiftOccupants && selectedSeat.shiftOccupants.length > 1 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  All Shifts Occupancy for Desk {selectedSeat.seatNumber}
                </h5>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  {selectedSeat.shiftOccupants.map((so, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{so.student.name}</span>
                        <div className="text-[11px] text-slate-400">Shift: {so.shiftName}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-emerald-400 font-medium">
                          {so.student.daysRemaining}d left
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(so.student.endDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── EDIT SEAT / CHANGE NUMBER OR SECTION MODAL ─────────────────── */}
      <Modal
        isOpen={!!editSeatModal}
        onClose={() => setEditSeatModal(null)}
        title="Edit Desk Details"
        subtitle={editSeatModal ? `Modify Desk #${editSeatModal.seatNumber} configuration` : ''}
        icon={<Edit2 className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {editSeatModal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Desk Number / Code
              </label>
              <input
                type="text"
                value={editSeatNumber}
                onChange={(e) => setEditSeatNumber(e.target.value)}
                placeholder="e.g. A-01, 105, Cabin-2"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hall / Section Name
              </label>
              <input
                type="text"
                value={editSection}
                onChange={(e) => setEditSection(e.target.value)}
                placeholder="e.g. Main Hall, First Floor, AC Room"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Existing sections: {sections.join(', ')}
              </p>
            </div>

            {updateSeatMutation.isError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {(updateSeatMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Failed to update desk'}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditSeatModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSeatMutation.isPending || !editSeatNumber.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 shadow disabled:opacity-50"
              >
                {updateSeatMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── ADD SINGLE DESK MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={showAddSingleModal}
        onClose={() => setShowAddSingleModal(false)}
        title="Add Single Desk"
        subtitle="Quickly add an individual seat to any section"
        icon={<Plus className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateSingleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Desk Number / Identifier
            </label>
            <input
              type="text"
              value={singleSeatNumber}
              onChange={(e) => setSingleSeatNumber(e.target.value)}
              placeholder="e.g. A-31, 101, Cabin-1"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hall / Section Name
            </label>
            <input
              type="text"
              value={singleSection}
              onChange={(e) => setSingleSection(e.target.value)}
              placeholder="e.g. Main Hall"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
            {sections.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[11px] text-slate-400 mr-1">Choose existing:</span>
                {sections.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSingleSection(sec)}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:underline px-2 py-0.5 rounded"
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}
          </div>

          {createSingleSeatMutation.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {(createSingleSeatMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Failed to add desk'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddSingleModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSingleSeatMutation.isPending || !singleSeatNumber.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 shadow disabled:opacity-50"
            >
              {createSingleSeatMutation.isPending ? 'Adding…' : 'Add Desk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── FAST ASSIGN STUDENT MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={!!assignStudentModal}
        onClose={() => setAssignStudentModal(null)}
        title={`Assign Desk ${assignStudentModal?.seatNumber || ''}`}
        subtitle="Quickly assign this vacant desk to a student"
        icon={<PlusCircle className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {assignStudentModal && (
          <form onSubmit={handleConfirmAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Student
              </label>
              <CustomSelect
                value={assignStudentId}
                onChange={setAssignStudentId}
                options={students.map((st) => ({
                  value: st._id,
                  label: `${st.name} (${st.membershipNumber}) - ${st.mobile}`,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                <CustomSelect
                  value={assignPlanId}
                  onChange={setAssignPlanId}
                  options={plans.map((p) => ({
                    value: p._id,
                    label: `${p.name} (₹${p.feePaise / 100})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shift</label>
                <CustomSelect
                  value={assignShiftId}
                  onChange={setAssignShiftId}
                  options={[
                    { value: '', label: 'General / Full Day' },
                    ...shifts.map((sh) => ({
                      value: sh._id,
                      label: `${sh.name} (${sh.startTime}-${sh.endTime})`,
                    })),
                  ]}
                />
              </div>
            </div>

            <DateRangeDurationSelector
              startDate={assignStartDate}
              endDate={assignEndDate}
              onChangeStartDate={setAssignStartDate}
              onChangeEndDate={setAssignEndDate}
              durationOption={assignDurationOption}
              onChangeDurationOption={setAssignDurationOption}
              label="Membership Validity & Duration"
            />

            {createMembershipMutation.isError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {(createMembershipMutation.error as { response?: { data?: { error?: string } } })?.response?.data
                  ?.error || 'Failed to assign desk'}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignStudentModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMembershipMutation.isPending}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 shadow"
              >
                {createMembershipMutation.isPending ? 'Assigning…' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── 1-CLICK DESK SWAP / CHANGE MODAL ────────────────────────────── */}
      <Modal
        isOpen={!!swapModalData}
        onClose={() => setSwapModalData(null)}
        title="Shift / Swap Desk"
        subtitle={swapModalData ? `Moving ${swapModalData.studentName} from Desk ${swapModalData.currentSeatNumber}` : ''}
        icon={<ArrowRightLeft className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        {swapModalData && (
          <form onSubmit={handleConfirmSwap} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Destination Desk
              </label>
              <CustomSelect
                value={targetSeatId}
                onChange={setTargetSeatId}
                options={allSeats
                  .filter((s) => s.status === 'available')
                  .map((s) => ({
                    value: s._id,
                    label: `Desk ${s.seatNumber} (${s.section || 'Hall'})`,
                  }))}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Only currently vacant desks are displayed for safe relocation.
              </p>
            </div>

            {changeSeatMutation.isError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {(changeSeatMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                  'Failed to change desk'}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSwapModalData(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changeSeatMutation.isPending || !targetSeatId}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 shadow disabled:opacity-50"
              >
                {changeSeatMutation.isPending ? 'Relocating…' : 'Move to Destination Desk'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── BULK GENERATOR MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Generate Desks"
        subtitle="Instantly populate a sequence of study desks for your library"
        icon={<Layers className="h-5 w-5 text-indigo-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Number
              </label>
              <input
                type="number"
                min="1"
                value={startNum}
                onChange={(e) => setStartNum(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Number</label>
              <input
                type="number"
                min="1"
                value={endNum}
                onChange={(e) => setEndNum(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prefix (Optional)
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. S- or A-"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section</label>
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Main Hall"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkCreate.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold !text-white hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
            >
              {bulkCreate.isPending ? 'Generating…' : 'Generate Desks'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── GENERIC CONFIRMATION MODAL ──────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        isLoading={
          deleteSeatMutation.isPending ||
          deleteSeatsBySectionMutation.isPending ||
          vacateSeatMutation.isPending
        }
      />
    </div>
  );
}
