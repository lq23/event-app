import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  createTheme,
  Button,
  colors,
  Modal,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";


import generateUniqueId from "../Components/generateUniqueId";
import { Roles, getUserHouse, houseToRolesMap } from "../Components/roles";
import EventHouseSelect from "./EventHouseSelect";
import TimeRangePicker, { Time } from "./TimePicker";
import { parse } from "date-fns";
import { useUser } from "./UserContext";
import { supabase } from "../supabase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: "'Lilita One', sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Lilita One';
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          src: url('./fonts/LilitaOne.woff2') format('woff2');
        }
      `,
    },
  },
});

type Role = (typeof Roles)[keyof typeof Roles];

const getRoleColor = (role: Role) => {
  switch (role) {
    case Roles.BROTHER:
      return "#ffd600"; // gold
    case Roles.KKG_SISTER:
    case Roles.KKG_SOCIAL:
      return "#000000"; // Black
    case Roles.APHI_SISTER:
    case Roles.APHI_SOCIAL:
      return "#f44336"; // Red
    case Roles.TRIDELT_SISTER:
    case Roles.TRIDELT_SOCIAL:
      return "#1976d2"; // Blue
    case Roles.DG_SISTER:
    case Roles.DG_SOCIAL:
      return "#4caf50"; // Green
    case Roles.PHISIG_SISTER:
    case Roles.PHISIG_SOCIAL:
      return "#ffd600"; // Yellow
    case Roles.AXO_SISTER:
    case Roles.AXO_SOCIAL:
      return "#b39ddb"; // Light purple
    case Roles.SDT_SISTER:
    case Roles.SDT_SOCIAL:
      return "#81d4fa"; // Light blue
    case Roles.AEPHI_SISTER:
    case Roles.AEPHI_SOCIAL:
      return "#ff69b4"; // Pink
    case Roles.AGD_SISTER:
    case Roles.AGD_SOCIAL:
      return "#ff9800"; // Orange
    case Roles.AXID_SISTER:
    case Roles.AXID_SOCIAL:
      return "#ff6f00"; // Dark orange
    case Roles.DPHIE_SISTER:
    case Roles.DPHIE_SOCIAL:
      return "#795548"; // Brown
    case Roles.BLUECH_SOCIAL:
      return "#1976d2"; // Blue
    case Roles.OWNER:
      return "#ffd600"; // Gold
    case Roles.NEO:
      return "#1D1901"; // brown
    case Roles.THETA_SISTER:
    case Roles.THETA_SOCIAL:
      return "#9c27b0"; // Purple
    case Roles.THETA_CHI_BROTHER:
    case Roles.THETA_CHI_SOCIAL:
      return "#f44336"; // red
    case Roles.DKE_BROTHER:
    case Roles.DKE_SOCIAL:
      return "#7c85ffff"; // Indigo
    case Roles.DU_BROTHER:
    case Roles.DU_SOCIAL:
      return "#009688"; // Teal
    case Roles.ZBT_BROTHER:
    case Roles.ZBT_SOCIAL:
      return "#201cffff";
    case Roles.AEPI_BROTHER:
    case Roles.AEPI_SOCIAL:
      return "#ff9800"; // Orange
    case Roles.SAE_BROTHER:
    case Roles.SAE_SOCIAL:
      return "#8bc34a"; // Light green
    case Roles.PIKE_BROTHER:
    case Roles.PIKE_SOCIAL:
      return "#fd7bbcff"; // Blue-grey
    case Roles.SAMMY_BROTHER:
    case Roles.SAMMY_SOCIAL:
      return "#9e9e9e"; // Grey
    case Roles.TKE_BROTHER:
    case Roles.TKE_SOCIAL:
      return "#795548"; // Brown
    case Roles.PSI_U_BROTHER:
    case Roles.PSI_U_SOCIAL:
      return "#8cc7f8ff";
    case Roles.DTD_BROTHER:
    case Roles.DTD_SOCIAL:
      return "#a400c5ff";
    default:
      return "#cccccc"; // fallback color
  }
};

// For testing purposes, set the currentUserRole here.
// To see both "Add Event" and "Request Event" buttons set this as Owner or Bluech Social.
// For sorority socials, set it to a value like "KKG Social" (which contains "Social").

interface Event {
  eventDescription: string;
  eventName: string;
  pairs: string[]; // explicit
  id: number;
  theme?: string;
  date: Date;
  time?: { start: Time; end: Time }; // proper shape
  rolesAllowedToView: Role[];
  rolesAllowedToEdit: Role[];
  submittedByRole?: Role;
  hostHouse?: string | null; // NEW: host house (e.g., "SIG_CHI")
  type?: "Darty" | "Night Party" | "Philanthropy";
}

const Calendar: React.FC = () => {
  const { currentUser } = useUser();
  if (!currentUser) {
    return <p>Loading...</p>;
  }
  const ROLE = String(currentUser?.role || "")
    .trim()
    .toUpperCase();
  const [currentEventPairs, setCurrentEventPairs] = useState<Role[]>([]);
  const [CreateDarty, setCreateDartyVisible] = useState<boolean>(false);
  const [CreateNightParty, setCreateNightPartyVisible] =
    useState<boolean>(false);
  const [CreatePhilo, setCreatePhiloVisible] = useState<boolean>(false);
  const [dayOrNight, setDayOrNightVisible] = useState<boolean>(false);
  const [eventDate, setEventDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [whatHouses, setWhathouses] = useState<string[]>([]);
  const [finishedVisible, setFinishVisible] = useState<boolean>(false);
  const [nextDarty, setNextDartyVisible] = useState<boolean>(false);
  const [nextNightParty, setNextNightPartyVisible] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [days, setDays] = useState<Date[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [showRequestEvent, setShowRequestEvent] = useState<boolean>(false);
  const [showRemoveEvent, setShowRemoveEvent] = useState<boolean>(false);
  const [eventsList, setEventsList] = useState<Event[]>(() => {
    const stored = localStorage.getItem("eventsList");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // revive the Date objects + upgrade time shape if needed
        return parsed.map((ev: any) => ({
          ...ev,
          date: new Date(ev.date),
          time:
            ev?.time?.start && ev?.time?.end
              ? ev.time
              : ev?.time
              ? { start: ev.time, end: ev.time }
              : undefined,
        }));
      } catch {
        console.warn("Failed to parse stored events, clearing it.");
        localStorage.removeItem("eventsList");
      }
    }
    return [];
  });

  const [showRemoveSelection, setShowRemoveSelection] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Event[]>([]);
  const [eventTheme, setEventTheme] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [eventTime, setEventTime] = useState<string>("");
  const [selectedPairRoles, setSelectedPairRoles] = useState<Role[]>([]);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [showPreviewNight, setShowPreviewNight] = useState<boolean>(false);
  const [showPreviewDarty, setShowPreviewDarty] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Time>({
    hours: 9,
    minutes: 0,
    meridiem: "AM",
  });
  const [endTime, setEndTime] = useState<Time>({
    hours: 17,
    minutes: 0,
    meridiem: "PM",
  });
  useEffect(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    setDays(eachDayOfInterval({ start, end }));

    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
  }, [currentDate]);

  useEffect(() => {
    localStorage.setItem("eventsList", JSON.stringify(eventsList));
  }, [eventsList]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqType, setReqType] = useState<
    "Darty" | "Night Party" | "Philanthropy" | ""
  >("");
  const [reqDate, setReqDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  ); // yyyy-mm-dd
  const [reqTheme, setReqTheme] = useState("");
  const [reqToHouse, setReqToHouse] = useState<string>(""); // host fraternity key
  const [reqPairs, setReqPairs] = useState<string[]>([]); // sorority tags
  const [reqMessage, setReqMessage] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqOK, setReqOK] = useState(false);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const formatTime = (time: Time) => {
    const hr = time.hours.toString().padStart(2, "0");
    const min = time.minutes.toString().padStart(2, "0");
    return `${hr}:${min} ${time.meridiem}`;
  };

  const formatTimeRange = (start: Time, end: Time): string => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };
  // Button Handlers
  const handleSelectPairRole = (role: Role) => {
    if (selectedPairRoles.includes(role)) {
      setSelectedPairRoles(selectedPairRoles.filter((r) => r !== role));
    } else {
      setSelectedPairRoles([...selectedPairRoles, role]);
    }
  };
  const handleAddEvent = () => {
    setShowAddEvent(true);
    setCreatePhiloVisible(false);
    setDayOrNightVisible(false);
    console.log("Add Event clicked");
  };
  const handleRequestEvent = () => {
    setReqType("");
    setReqDate(new Date().toISOString().slice(0, 10));
    setReqTheme("");
    setReqToHouse("");
    setReqPairs([]);
    setReqMessage("");
    setReqError(null);
    setReqOK(false);
    setRequestOpen(true);
  };
  const submitEventRequest = async () => {
const from_role = currentUser.role;
const from_house = getUserHouseFromRole(from_role);
const to_house = normalizeHouseKey(reqToHouse);   // << IMPORTANT
const sender_id = currentUser.id;

setReqError(null);

if (!reqType || !reqDate || !reqToHouse) {
  setReqError("Type, Date, and Host Fraternity are required.");
  return;
}

try {
  setReqBusy(true);

  // If your table name differs, change "event_requests" below.
  const { error } = await supabase.from("event_requests").insert({
    type: reqType,
    date: reqDate, // store as date (YYYY-MM-DD) or ISO string if your column is text
    theme: reqTheme || null,
    pairs: reqPairs.length ? reqPairs : null, // text[] or jsonb[] in PG
    message: reqMessage || null,
    from_role,
    from_house,
    to_house,
    submitted_at: new Date().toISOString(),
    status: "pending",
    sender_id,
  });

      if (error) throw error;

      setReqOK(true);
      // optional: close after short delay
      setTimeout(() => setRequestOpen(false), 700);
    } catch (e: any) {
      setReqError(e.message || "Failed to submit request.");
    } finally {
      setReqBusy(false);
    }
  };

  const handleNextNightParty = () => {
    if (!eventTheme.trim() && !eventTime) {
      alert("Please enter a theme and time for the Party");
      return;
    }
    setNextNightPartyVisible(true);
    setCreateNightPartyVisible(false);
  };

  const handleNextDarty = () => {
    if (!eventTheme.trim()) {
      alert("Please enter a theme and time for the Darty");
      return;
    }
    setNextDartyVisible(true);
    setCreateDartyVisible(false);
  };
  const handleCreatePhilo = () => {
    setCreatePhiloVisible(true);
    setShowAddEvent(false);
    setDayOrNightVisible(false);

    console.log("Create Philanthropy clicked");
  };
  const handleDayOrNight = () => {
    setDayOrNightVisible(true);
    setShowAddEvent(false);
    setCreatePhiloVisible(false);
    console.log("Day or Night clicked");
  };

  const handleFinishPhilo = () => {};
  const handlePreviewEventNight = () => {
    // optionally validate that required fields are set
    if (!eventTheme.trim() || selectedHouses.length === 0) {
      alert("Please complete event theme and pair selection.");
      return;
    }
    setShowPreviewNight(true);
    setNextNightPartyVisible(false);
  };
  const handlePreviewEventDarty = () => {
    // optionally validate that required fields are set
    if (!eventTheme.trim() || selectedHouses.length === 0) {
      alert("Please complete event theme and pair selection.");
      return;
    }
    setShowPreviewDarty(true);
    setNextDartyVisible(false);
  };

  const houseDataS = [
    { name: "KKG", roles: [Roles.KKG_SISTER, Roles.KKG_SOCIAL] },
    { name: "APHI", roles: [Roles.APHI_SISTER, Roles.APHI_SOCIAL] },
    { name: "TRIDELT", roles: [Roles.TRIDELT_SISTER, Roles.TRIDELT_SOCIAL] },
    { name: "DG", roles: [Roles.DG_SISTER, Roles.DG_SOCIAL] },
    { name: "PHISIG", roles: [Roles.PHISIG_SISTER, Roles.PHISIG_SOCIAL] },
    { name: "AXO", roles: [Roles.AXO_SISTER, Roles.AXO_SOCIAL] },
    { name: "AEPHI", roles: [Roles.AEPHI_SISTER, Roles.AEPHI_SOCIAL] },
    { name: "SDT", roles: [Roles.SDT_SISTER, Roles.SDT_SOCIAL] },
    { name: "AXID", roles: [Roles.AXID_SISTER, Roles.AXID_SOCIAL] },
    { name: "THETA", roles: [Roles.THETA_SISTER, Roles.THETA_SOCIAL] },
    { name: "AGD", roles: [Roles.AGD_SISTER, Roles.AGD_SOCIAL] },
    { name: "DPHIE", roles: [Roles.DPHIE_SISTER, Roles.DPHIE_SOCIAL] },
  ];
  const houseDataF = [
    {
      name: "THETA_CHI",
      roles: [Roles.THETA_CHI_BROTHER, Roles.THETA_CHI_SOCIAL],
    },
    { name: "DKE", roles: [Roles.DKE_BROTHER, Roles.DKE_SOCIAL] },
    { name: "DU", roles: [Roles.DU_BROTHER, Roles.DU_SOCIAL] },
    { name: "ZBT", roles: [Roles.ZBT_BROTHER, Roles.ZBT_SOCIAL] },
    { name: "AEPI", roles: [Roles.AEPI_BROTHER, Roles.AEPI_SOCIAL] },
    { name: "SAE", roles: [Roles.SAE_BROTHER, Roles.SAE_SOCIAL] },
    { name: "PIKE", roles: [Roles.PIKE_BROTHER, Roles.PIKE_SOCIAL] },
    { name: "SAMMY", roles: [Roles.SAMMY_BROTHER, Roles.SAMMY_SOCIAL] },
    { name: "TKE", roles: [Roles.TKE_BROTHER, Roles.TKE_SOCIAL] },
    { name: "PSI_U", roles: [Roles.PSI_U_BROTHER, Roles.PSI_U_SOCIAL] },
    {
      name: "SIG_CHI",
      roles: [Roles.BROTHER, Roles.BLUECH_SOCIAL, Roles.OWNER, Roles.NEO],
    },
    { name: "DTD", roles: [Roles.DTD_BROTHER, Roles.DTD_SOCIAL] },
  ];
  // Determine button visibility based on currentUserRole:

  // Example filtering of events based on role:
  const visibleEvents = eventsList.filter((event) => {
    return event.rolesAllowedToView.includes(currentUser.role);
  });

  const handleFinalizeEvent = (
    eventType: "Darty" | "Night Party" | "Philanthropy"
  ) => {
    const currentDayStr = format(currentDate, "yyyy-MM-dd");
    const existsSameType = eventsList.some(
      (ev) =>
        format(ev.date, "yyyy-MM-dd") === currentDayStr && ev.type === eventType
    );
    if (existsSameType) {
      alert(`An event of type ${eventType} already exists on this day.`);
      return;
    }
    const newEvent: Event = {
      id: generateUniqueId(),
      type: eventType,
      date: currentDate,
      theme: eventTheme,
      time: { start: startTime, end: endTime }, // FIXED: store both start/end
      rolesAllowedToView: [],
      rolesAllowedToEdit: [],
      pairs: selectedHouses,
      eventName: eventType === "Philanthropy" ? eventName : "",
      eventDescription: eventType === "Philanthropy" ? eventDescription : "",
      hostHouse: getUserHouseFromRoleZ(currentUser.role) || null, // NEW
    };
    setEventsList([...eventsList, newEvent]);
    // Reset event creation UI
    setShowAddEvent(false);
    setNextDartyVisible(false);
    setCreateDartyVisible(false);
    setCreateNightPartyVisible(false);
    setEventTheme("");
  };
  function normalizeHouseKey(input: string): string {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  const FRAT_KEYS = new Set([
    "SIG CHI",
    "DKE",
    "Theta CHI",
    "SAE",
    "PSI U",
    "DU",
    "PIKE",
    "SAMMY",
    "TKE",
    "ZBT",
    "AEPI",
    "DTD",
  ]);
  function getUserHouseFromRole(role: string): string | null {
    // e.g. "SIG_CHI_SOCIAL" → "SIG_CHI"
    const m = String(role)
      .trim()
      .toUpperCase()
      .match(/^(.*)_(SOCIAL|SISTER|BROTHER)$/);
    return m ? m[1] : null;
  }
  const userRole = currentUser.role; // e.g. "SIG_CHI_SOCIAL"
  const userHouseKey = normalizeHouseKey(userRole.split("_SOCIAL")[0]);
  // if role = "SIG_CHI_SOCIAL", split → ["SIG_CHI",""], normalize → "SIG_CHI"
  const isFratSocial =
    ROLE.endsWith("_SOCIAL") && FRAT_KEYS.has(ROLE.replace(/_SOCIAL$/, ""));

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function normalizeHouseKeyZ(input: string): string {
    return String(input)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  function getUserHouseFromRoleZ(role: string): string | null {
    const m = String(role)
      .trim()
      .toUpperCase()
      .match(/^(.*)_(SOCIAL|SISTER|BROTHER)$/);
    if (!m) return null; // OWNER, BLUECH, etc. → null
    return m[1].replace(/[^A-Z0-9]+/g, "_"); // normalize
  }
  // Only show events if your house is in the pairs
function userCanSeeEvent(event: Event, currentUser: any) {
  const userHouse = getUserHouseFromRoleZ(currentUser.role);
  if (!userHouse) return false;
  // event.pairs is array of house names
  return Array.isArray(event.pairs) && event.pairs.includes(userHouse);
}
  const myHouse = getUserHouseFromRoleZ(currentUser.role);
  const houseDataAllZ = useMemo(() => [...houseDataF, ...houseDataS], []);
  const pairOptions = useMemo(
    () => houseDataAllZ.filter((h) => !myHouse || h.name !== myHouse),
    [myHouse, houseDataAllZ]
  );
  const isFratSocialZ =
    !!myHouse && FRAT_KEYS.has(myHouse) && /_SOCIAL$/i.test(currentUser.role);
  const hostFratOptions = isFratSocial
    ? Array.from(FRAT_KEYS).filter((h) => h !== myHouse) // hide your own, optional
    : Array.from(FRAT_KEYS); // sororities / owner see all

  const getEventColor = (eventType?: string) => {
    switch (eventType) {
      case "Philanthropy":
        return "rgb(80, 183, 231)"; // green
      case "Darty":
        return "#ffd600"; // yellow
      case "Night Party":
        return "rgb(183, 5, 228)"; // purple-ish
      default:
        return "#ffffff"; // fallback white
    }
  };
  const houseDataAll = [...houseDataS, ...houseDataF];
  const showAddButton = ROLE === "OWNER" || isFratSocial;

  const showRequestButton =
    ROLE === "OWNER" || ROLE === "BLUECH_SOCIAL" || ROLE.includes("SOCIAL");
  const showRemoveButton =
    ROLE === "OWNER" || ROLE === "BLUECH_SOCIAL" || ROLE.includes("Social");

  console.log({
    ROLE,
    userHouseKey,
    isFratSocial,
    showAddButton,
    FRAT_KEYS,
  });
  const handleCancelPairsNight = () => {
    setCreateNightPartyVisible(true);
    setNextNightPartyVisible(false);
    setCreatePhiloVisible(false);
  };

  const handleCancelPairsDarty = () => {
    setCreateDartyVisible(true);
    setNextDartyVisible(false);
    setCreateNightPartyVisible(false);
    setNextNightPartyVisible(false);
  };

  const handleCancel = () => {
    setShowAddEvent(false);
    setCreateDartyVisible(false);
    setCreateNightPartyVisible(false);
    setCreatePhiloVisible(false);
    setDayOrNightVisible(false);
  };
  const handleCancelDarty = (cancel: boolean) => {
    setCreateDartyVisible(false);
    setDayOrNightVisible(true);
    setCreateNightPartyVisible(false);
  };
  const handleCancelPhilo = (cancel: boolean) => {
    setCreatePhiloVisible(false);
    setShowAddEvent(true);
    setCreateDartyVisible(false);
    setCreateNightPartyVisible(false);
    setEventName("");
    setEventDescription("");
  };
  const handleCancelNightParty = (cancel: boolean) => {
    setDayOrNightVisible(true);
    setShowAddEvent(false);
    setCreatePhiloVisible(false);
    setCreateNightPartyVisible(false);
  };
  const handleCreateDarty = () => {
    console.log("Darty created");
    setDayOrNightVisible(false);
    setCreateDartyVisible(true);
    setCreatePhiloVisible(false);
  };
  const handleCreateNightParty = () => {
    console.log("Night Party created");
    setDayOrNightVisible(false);
    setCreateNightPartyVisible(true);
  };

  const handleCancelParty = () => {
    setDayOrNightVisible(false);
    setShowAddEvent(true);
  };

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const handleRemoveEvent = (id: number) => {
    if (window.confirm("Are you sure you want to remove this event?")) {
      setEventsList(eventsList.filter((ev) => ev.id !== id));
      setSelectedEventId(null);
    }
  };
  const hasEvents = eventsList.some(
    (ev) => format(ev.date, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
  );
  const eventTypes = eventsList
    .filter(
      (ev) =>
        format(ev.date, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
    )
    .map((ev) => ev.type);

  function openDayModal(day: Date) {
    setModalDate(day);
  }
  function closeModal() {
    setModalDate(null);
  }

  // ===== NEW: visibility control (admins see all; else host or paired) =====
  const isOwner = ROLE === "OWNER" || ROLE === "BLUECH_SOCIAL";
  function canSeeEvent(ev: Event, userRoleStr: string): boolean {
    if (isOwner) return true;
    const userHouse = getUserHouseFromRoleZ(userRoleStr);
    if (!userHouse) return false;
    if (ev.hostHouse && ev.hostHouse === userHouse) return true;
    return Array.isArray(ev.pairs) && ev.pairs.includes(userHouse);
  }
  const userVisibleEvents = useMemo(
    () => eventsList.filter((ev) => canSeeEvent(ev, currentUser.role)),
    [eventsList, currentUser.role]
  );

  const modalEvents = modalDate
    ? userVisibleEvents.filter(
        (ev) =>
          format(ev.date, "yyyy-MM-dd") === format(modalDate, "yyyy-MM-dd")
      )
    : [];

  return (
    <Box
      sx={{
        position: "relative",
        height: 1,
        maxWidth: 1700,
        mx: "auto",
        my: -25,
        bgcolor: "#212121",
        color: "#ffffff",
        borderRadius: 3,
        p: 12,
        boxShadow: 4,
      }}
    >
      <Box
        sx={{
          opacity: showAddEvent || nextNightParty || nextDarty ? 0.3 : 1,
          transition: "opacity 0.3s ease",
        }}
      ></Box>

      {/* Month / Year Header */}
      <Typography
        variant="h2"
        align="center"
        gutterBottom
        sx={{
          fontWeight: 500,
          fontFamily: "'Lilita One', sans-serif",
          color: "#1D1901",
          textShadow: "0 0 10px #ffd600, 0 0 20px #ffd600, 0 0 30px #ffd600",
        }}
      >
        {format(currentDate, "MMMM yyyy")}
      </Typography>

      {/* Conditional Event Buttons */}
      <Box
        display="flex"
        justifyContent="right"
        mb={2}
        sx={{ mt: -10 }}
        height={50}
      >
        {showAddButton && (
          <Button
            variant="contained"
            sx={{
              mt: -7,
              mr: -1,
              backgroundColor: "#1D1901",
              color: "#ffd600",
              fontFamily: "'Lilita One', sans-serif",
              height: 100,
              width: 150,
              boxShadow: "0 0 10px #ffd600",
              transition: "box-shadow 0.3s ease",
              textShadow: "0px 0px 15px #ffd600",
              "&:hover": {
                boxShadow: "0 0 20px rgb(38, 223, 146)",
                textShadow: "0px 0px 20px rgb(38, 223, 146)",
              },
            }}
            onClick={handleAddEvent}
          >
            Add Event
          </Button>
        )}
      </Box>
      <Box
        display="flex"
        justifyContent="right"
        mb={2}
        sx={{ mt: -4 }}
        height={50}
      >
        {showRequestButton && (
          <Button
            variant="contained"
            sx={{
              mt: 5,
              mr: -1,
              backgroundColor: "#1D1901",
              color: "#1D1901",
              fontFamily: "'Lilita One', sans-serif",
              height: 100,
              width: 150,
              boxShadow: "0 0 10px rgb(80, 183, 231)",
              transition: "box-shadow 0.3s ease",
              textShadow: "0px 0px 20px rgb(80, 183, 231)",
              "&:hover": {
                boxShadow: "0 0 20px rgb(190, 189, 181)",
                textShadow: "0px 0px 25px rgb(190, 189, 181)",
              },
            }}
            onClick={handleRequestEvent}
          >
            Request Event
          </Button>
        )}
      </Box>
      <Box
        display="flex"
        justifyContent="right"
        mb={2}
        sx={{ mt: -10 }}
        height={50}
      ></Box>

      {/* Dropdown Row */}
      <Grid container spacing={2} justifyContent="left" sx={{ mb: -1 }}>
        {/* Day Dropdown */}
        <Grid>
          <FormControl
            variant="filled"
            size="small"
            sx={{
              minWidth: 100,
              bgcolor: "#424242",
              "& .MuiFilledInput-root": { color: "#fff" },
            }}
          >
            <InputLabel sx={{ color: "#ccc" }}>Day</InputLabel>
            <Select
              value={selectedDay}
              onChange={(e) =>
                setCurrentDate(
                  new Date(selectedYear, selectedMonth, Number(e.target.value))
                )
              }
              sx={{
                "& .MuiSelect-icon": { color: "#fff" },
              }}
            >
              {Array.from({ length: daysInMonth }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Dialog
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              bgcolor: "#212121",
              color: "#fff",
              borderRadius: 2,
              border: "1px solid #444",
              boxShadow: "0 0 20px #ffd600",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "'Lilita One', sans-serif",
              color: "#ffd600",
              textShadow: "0 0 10px #ffd600",
            }}
          >
            Request an Event
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            {/* TYPE */}
            <FormControl
              fullWidth
              variant="filled"
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": { bgcolor: "#333", color: "#fff" },
                "& .MuiInputLabel-root": { color: "#ffd600" },
                "& .MuiSelect-icon": { color: "#ffd600" },
                
              }}
            >
              <InputLabel>Type</InputLabel>
              <Select
                value={reqType}
                
                onChange={(e) => setReqType(e.target.value as any)}
              >
                <MenuItem value={"Darty"}>Darty</MenuItem>
                <MenuItem value={"Night Party"}>Night Party</MenuItem>
                <MenuItem value={"Philanthropy"}>Philanthropy</MenuItem>
              </Select>
            </FormControl>

            {/* DATE */}
            <TextField
              label="Date"
              type="date"
              fullWidth
              variant="filled"
              value={reqDate}
              onChange={(e) => setReqDate(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": { bgcolor: "#333", color: "#fff" },
                "& .MuiInputLabel-root": { color: "#ffd600" },
                "& input[type=date]::-webkit-calendar-picker-indicator": {
                  filter: "invert(1)",
                },
              }}
              InputLabelProps={{ shrink: true }}
            />

            {/* THEME */}
            <TextField
              label="Theme (optional)"
              fullWidth
              variant="filled"
              value={reqTheme}
              onChange={(e) => setReqTheme(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": { bgcolor: "#333", color: "#fff" },
                "& .MuiInputLabel-root": { color: "#ffd600" },
              }}
            />

            {/* HOST FRATERNITY */}
            <FormControl
              fullWidth
              variant="filled"
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": { bgcolor: "#333", color: "#fff" },
                "& .MuiInputLabel-root": { color: "#ffd600" },
                "& .MuiSelect-icon": { color: "#ffd600" },
              }}
            >
              <InputLabel>Host Fraternity</InputLabel>
              <Select
                value={reqToHouse}
                onChange={(e) => setReqToHouse(e.target.value)}
              >
                {hostFratOptions.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* PAIRING SORORITIES */}
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.85, color: "#ffd600" }}
            >
              Pairs
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                mb: 2,
              }}
            >
              {pairOptions.map((house) => {
                const on = reqPairs.includes(house.name);
                const glow = getRoleColor(house.roles[0]); // reuse your color map
                const isHost = reqToHouse === house.name; // optional: block pairing with host

                return (
                  <Button
                    key={house.name}
                    variant={on ? "contained" : "outlined"}
                    size="small"
                    disabled={isHost}
                    onClick={() =>
                      setReqPairs((p) =>
                        on ? p.filter((x) => x !== house.name) : [...p, house.name]
                      )
                    }
                    sx={{
                      justifySelf: "start",
                      bgcolor: on ? "#1D1901" : "transparent",
                      color: on ? "#ffd600" : "#ffd600",
                      borderColor: "#ffd600",
                      textTransform: "none",
                      boxShadow: on ? "0 0 10px #ffd600" : "none",
                      "&:hover": {
                        boxShadow: "0 0 20px #ffd600",
                        color: "#ffd600",
                        borderColor: "#ffd600",
                      },
                    }}
                  >
                    {house.name}
                  </Button>
                );
              })}
            </Box>

            {/* MESSAGE */}
            <TextField
              label="Message (optional)"
              fullWidth
              multiline
              minRows={3}
              variant="filled"
              value={reqMessage}
              onChange={(e) => setReqMessage(e.target.value)}
              sx={{
                "& .MuiFilledInput-root": { bgcolor: "#333", color: "#fff" },
                "& .MuiInputLabel-root": { color: "#ffd600" },
              }}
            />

            {reqError && (
              <Typography sx={{ mt: 2, color: "#ff6b6b" }}>
                {reqError}
              </Typography>
            )}
            {reqOK && (
              <Typography sx={{ mt: 2, color: "#26df92" }}>
                Request sent!
              </Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setRequestOpen(false)}
              sx={{
                color: "#ffd600",
                textShadow: "0 0 10px #ffd600",
                "&:hover": { color: "#e6c200" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitEventRequest}
              disabled={reqBusy}
              variant="contained"
              sx={{
                bgcolor: "#1D1901",
                color: "#ffd600",
                boxShadow: "0 0 10px #ffd600",
                "&:hover": {
                  boxShadow: "0 0 20px #26df92",
                  color: "#26df92",
                  bgcolor: "#1D1901",
                },
              }}
            >
              {reqBusy ? "Sending…" : "Send Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Month Dropdown */}
        <Grid >
          <FormControl
            variant="filled"
            size="small"
            sx={{
              minWidth: 140,
              bgcolor: "#424242",
              "& .MuiFilledInput-root": { color: "#fff" },
            }}
          >
            <InputLabel sx={{ color: "#ccc" }}>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) =>
                setCurrentDate(
                  new Date(selectedYear, Number(e.target.value), selectedDay)
                )
              }
              sx={{
                "& .MuiSelect-icon": { color: "#fff" },
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {format(new Date(0, i), "MMMM")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Year Dropdown */}
        <Grid >
          <FormControl
            variant="filled"
            size="small"
            sx={{
              minWidth: 100,
              bgcolor: "#424242",
              "& .MuiFilledInput-root": { color: "#fff" },
            }}
          >
            <InputLabel sx={{ color: "#ccc" }}>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) =>
                setCurrentDate(
                  new Date(Number(e.target.value), selectedMonth, selectedDay)
                )
              }
              sx={{
                "& .MuiSelect-icon": { color: "#fff" },
              }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const y = selectedYear - 5 + i;
                return (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Weekday Labels */}
      <Grid container>
        {weekdays.map((wd) => (
          <Grid

            size={{ xs: 1 }}
            key={wd}
            sx={{
              textAlign: "center",
              color: "#bbbbbb",
              fontWeight: "600",
              textTransform: "uppercase",
              p: 11,
            }}
          >
            {wd}
          </Grid>
        ))}
      </Grid>
      {(showAddEvent ||
        nextNightParty ||
        CreatePhilo ||
        CreateDarty ||
        CreateNightParty ||
        dayOrNight ||
        nextDarty ||
        showPreviewDarty ||
        showPreviewNight) && (
        <Box
          sx={{
            position: "absolute",
            top: -350,
            left: 0,
            width: "100%",
            height: "120%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            // Optional: semi-transparent background for the overlay itself
            bgcolor: "rgba(33, 33, 33, 0.8)",
            p: 4,
            borderRadius: 3,
          }}
        >
          {showAddEvent && !nextNightParty && !nextDarty && (
            <div className="Type of Event?">
              <h2 style={{ color: "#ffd066" }}>What type of event we makin?</h2>
              <Button
                sx={{
                  ml: 5,
                  mt: 15,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                  boxShadow: "0 0 10px #ffd600",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  height: 70,
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(4, 130, 214)",
                    textShadow: "0px 0px 20px rgb(4, 130, 214)",
                    color: "rgb(4, 130, 214)",
                  },
                }}
                onClick={() => {
                  handleCreatePhilo();
                }}
              >
                Philanthropy 🤝
              </Button>
              <Button
                sx={{
                  mt: 15,
                  ml: 20,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                  boxShadow: "0 0 10px #ffd600",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  height: 70,
                  width: 150,
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(183, 5, 228)",
                    textShadow: "0px 0px 20px rgb(183, 5, 228)",
                    color: "rgb(183, 5, 228)",
                  },
                }}
                onClick={() => {
                  handleDayOrNight();
                }}
              >
                Party🕺
              </Button>

              <p
                style={{
                  marginTop: 105,
                  marginLeft: 170,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                }}
              >
                Selected Date: {format(currentDate, "MMMM d, yyyy")}
              </p>

              <Button
                sx={{
                  ml: 29,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                className="cancel-button cancel-brother"
                color="primary"
                onClick={() => {
                  handleCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {nextNightParty && (
            <div className="Pairs">
              <h2 style={{ color: "rgb(183, 5, 228)" }}>
                Who You wanna see there?
              </h2>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 3,
                }}
              >
                {houseDataAll.map((house) => {
                  const isSelected = selectedHouses.includes(house.name);
                  // Use one of the roles (for instance, the sister role) to get the glow color.
                  const glowColor = getRoleColor(house.roles[0]);
                  return (
                    <Button
                      key={house.name}
                      variant={isSelected ? "contained" : "outlined"}
                      sx={{
                        fontFamily: "'Lilita One', sans-serif",
                        height: 50,
                        minWidth: 110,
                        boxShadow: isSelected
                          ? `0 0 10px ${glowColor}`
                          : undefined,
                        textShadow: isSelected
                          ? `0px 0px 15px ${glowColor}`
                          : undefined,
                        transition:
                          "box-shadow 0.3s ease, text-shadow 0.3s ease",
                        backgroundColor: isSelected ? "#1D1901" : undefined,
                        color: "#1D1901",
                        "&:hover": {
                          boxShadow: `0 0 20px ${glowColor}`,
                          textShadow: `0px 0px 20px ${glowColor}`,
                          color: glowColor,
                        },
                      }}
                      onClick={() => {
                        // Toggle the house in the selected houses list.
                        if (isSelected) {
                          setSelectedHouses(
                            selectedHouses.filter((h) => h !== house.name)
                          );
                        } else {
                          setSelectedHouses([...selectedHouses, house.name]);
                        }
                      }}
                    >
                      {house.name}
                    </Button>
                  );
                })}
              </Box>
              <Button
                className="Create-button next"
                sx={{
                  mt: 5,
                  ml: 8,
                  color: "rgb(255, 0, 242)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(255, 0, 242)",
                  boxShadow: "0 0 10px rgb(255, 0, 242)",
                  transition: "box-shadow 0.3s ease",

                  "&:hover": {
                    boxShadow: "0 0 20px rgb(183, 5, 228)",
                    textShadow: "0px 0px 20px rgb(183, 5, 228)",
                    color: "rgb(183, 5, 228)",
                  },
                }}
                onClick={() => {
                  handlePreviewEventNight();
                }}
              >
                Add Pairs
              </Button>
              <Button
                className="cancel-button cancel-brother"
                sx={{
                  height: 39,
                  mt: 5,
                  ml: 29,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                color="primary"
                onClick={() => {
                  handleCancelPairsNight();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {CreatePhilo && (
            <div className="Philanthropy">
              <h2 style={{ marginLeft: 0, color: "#ffd600" }}>
                What Philanthropy are we doing?
              </h2>
              <input
                type="text"
                placeholder="What's it called?"
                className="text-box"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter Philanthropy Description"
                className="text-box"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
              <p
                style={{
                  marginTop: 10,
                  marginLeft: 209,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                }}
              >
                Selected Date: {format(currentDate, "MMMM d, yyyy")}
              </p>
              <Button
                className="Create-button next"
                color="primary"
                onClick={() => {
                  handleFinalizeEvent("Philanthropy");
                  setCreatePhiloVisible(false);
                }}
                sx={{
                  ml: 15,
                  mt: 2,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                  boxShadow: "0 0 10px #ffd600",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(4, 130, 214)",
                    textShadow: "0px 0px 20px rgb(4, 130, 214)",
                    color: "rgb(4, 130, 214)",
                  },
                }}
              >
                Create Philanthropy
              </Button>
              <Button
                className="cancel-button cancel-brother"
                color="primary"
                onClick={() => {
                  handleCancelPhilo(false);
                }}
                sx={{
                  ml: 15,
                  mt: 2,
                  color: "rgb(255, 123, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(255, 123, 0)",
                  boxShadow: "0 0 10px rgb(255, 123, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(214, 4, 4)",
                    textShadow: "0px 0px 20px rgb(214, 4, 4)",
                    color: "rgb(214, 4, 4)",
                  },
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {dayOrNight && (
            <div className="Type of Event?">
              <h2 style={{ color: "rgb(228, 157, 5)" }}>Darty</h2>
              <h2 style={{ color: "rgb(228, 5, 5)" }}>Or</h2>
              <h2 style={{ color: "rgb(183, 5, 228)" }}>Night Party</h2>
              <Button
                sx={{
                  mt: 15,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                  boxShadow: "0 0 10px #ffd600",
                  transition: "box-shadow 0.3s ease",
                  height: 70,
                  width: 150,
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(231, 112, 1)",
                    textShadow: "0px 0px 20px rgb(231, 112, 1)",
                    color: "rgb(231, 112, 1)",
                    width: 150,
                  },
                }}
                onClick={() => {
                  handleCreateDarty();
                }}
              >
                Darty ☀️
              </Button>
              <Button
                sx={{
                  mt: 15,
                  ml: 20,
                  color: "rgb(255, 2, 192)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(255, 2, 192)",
                  boxShadow: "0 0 10px rgb(255, 2, 192)",
                  transition: "box-shadow 0.3s ease",
                  height: 70,
                  width: 150,
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(183, 5, 228)",
                    textShadow: "0px 0px 20px rgb(183, 5, 228)",
                    color: "rgb(183, 5, 228)",
                  },
                }}
                onClick={() => {
                  handleCreateNightParty();
                }}
              >
                Night Party 🌆
              </Button>

              <p
                style={{
                  marginTop: 105,
                  marginLeft: 129,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                }}
              >
                Selected Date: {format(currentDate, "MMMM d, yyyy")}
              </p>

              <Button
                sx={{
                  ml: 22.5,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                className="cancel-button cancel-brother"
                color="primary"
                onClick={() => {
                  handleCancelParty();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {CreateNightParty && (
            <div className="Night Party">
              <h2 style={{ marginLeft: 0, color: "rgb(183, 5, 228)" }}>
                What Type of Party are throwing?
              </h2>
              <input
                type="text"
                placeholder="What's The Theme?"
                className="text-box"
                value={eventTheme}
                onChange={(e) => setEventTheme(e.target.value)}
              />
              <TimeRangePicker
                startTime={startTime}
                endTime={endTime}
                onChangeStart={setStartTime}
                onChangeEnd={setEndTime}
              />

              <Button
                sx={{
                  mt: 5,
                  ml: 19,
                  color: "rgb(38, 223, 146)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(38, 223, 146)",
                  boxShadow: "0 0 10px rgb(38, 223, 146)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px  #ffd600",
                    textShadow: "0px 0px 20px  #ffd600",
                    color: "#ffd600",
                  },
                }}
                className="Next-button next"
                color="primary"
                onClick={() => {
                  handleNextNightParty();
                }}
              >
                Next
              </Button>
              <Button
                sx={{
                  mt: 5,
                  ml: 22.5,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                className="cancel-button cancel-brother"
                color="primary"
                onClick={() => {
                  handleCancelNightParty(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {CreateDarty && (
            <div className="Darty">
              <h2 style={{ marginLeft: 0, color: "#ffd600" }}>
                What Type of Darty are throwing?
              </h2>
              <input
                type="text"
                placeholder="What's The Theme?"
                className="text-box"
                value={eventTheme}
                onChange={(e) => setEventTheme(e.target.value)}
              />
              <TimeRangePicker
                startTime={startTime}
                endTime={endTime}
                onChangeStart={setStartTime}
                onChangeEnd={setEndTime}
              />
              <Button
                sx={{
                  mt: 5,
                  ml: 19,
                  color: "rgb(38, 223, 146)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(38, 223, 146)",
                  boxShadow: "0 0 10px rgb(38, 223, 146)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px  #ffd600",
                    textShadow: "0px 0px 20px  #ffd600",
                    color: "#ffd600",
                  },
                }}
                className="Next-button next"
                color="primary"
                onClick={() => {
                  handleNextDarty();
                }}
              >
                Next
              </Button>

              <Button
                sx={{
                  height: 39,
                  mt: 5,
                  ml: 29,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                className="cancel-button cancel-brother"
                color="primary"
                onClick={() => {
                  handleCancelDarty(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          {showPreviewNight && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                border: "1px solid #555",
                borderRadius: 2,
                bgcolor: "#333",
                color: "#fff",
                width: "80%",
                textAlign: "center",
              }}
            >
              <Typography variant="h6">Preview Event</Typography>
              <Typography variant="body1">Theme: {eventTheme}</Typography>
              <Typography variant="body1">
                Pairs: {selectedHouses.join(", ")}
              </Typography>
              <Typography variant="body1">
                Time: {formatTimeRange(startTime, endTime)}
              </Typography>
              <Button
                sx={{
                  mt: 2,
                  mr: 2,
                }}
                variant="contained"
                onClick={() => {
                  handleFinalizeEvent("Night Party");
                  setShowPreviewNight(false);
                }}
              >
                Confirm
              </Button>
              <Button
                sx={{
                  mt: 2,
                  ml: 2,
                }}
                variant="outlined"
                onClick={() => setShowPreviewNight(false)}
              >
                Cancel
              </Button>
            </Box>
          )}
          {showPreviewDarty && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                border: "1px solid #555",
                borderRadius: 2,
                bgcolor: "#333",
                color: "#fff",
                width: "80%",
                textAlign: "center",
              }}
            >
              <Typography variant="h6">Preview Event</Typography>
              <Typography variant="body1">Theme: {eventTheme}</Typography>
              <Typography variant="body1">
                Pairs: {selectedHouses.join(", ")}
              </Typography>
              <Typography variant="body1">
                Time: {formatTimeRange(startTime, endTime)}
              </Typography>
              <Button
                sx={{
                  mt: 2,
                  mr: 2,
                }}
                variant="contained"
                onClick={() => {
                  handleFinalizeEvent("Darty");
                  setShowPreviewDarty(false);
                }}
              >
                Confirm
              </Button>
              <Button
                sx={{
                  mt: 2,
                  ml: 2,
                }}
                variant="outlined"
                onClick={() => setShowPreviewDarty(false)}
              >
                Cancel
              </Button>
            </Box>
          )}

          {nextDarty && (
            <div className="Pairs">
              <h2 style={{ color: "#ffd600" }}>Who You wanna see there?</h2>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 3,
                }}
              >
                {houseDataAll.map((house) => {
                  const isSelected = selectedHouses.includes(house.name);
                  // Use one of the roles (for instance, the sister role) to get the glow color.
                  const glowColor = getRoleColor(house.roles[0]);
                  return (
                    <Button
                      key={house.name}
                      variant={isSelected ? "contained" : "outlined"}
                      sx={{
                        fontFamily: "'Lilita One', sans-serif",
                        height: 50,
                        minWidth: 110,
                        boxShadow: isSelected
                          ? `0 0 10px ${glowColor}`
                          : undefined,
                        textShadow: isSelected
                          ? `0px 0px 15px ${glowColor}`
                          : undefined,
                        transition:
                          "box-shadow 0.3s ease, text-shadow 0.3s ease",
                        backgroundColor: isSelected ? "#1D1901" : undefined,
                        color: "#1D1901",
                        "&:hover": {
                          boxShadow: `0 0 20px ${glowColor}`,
                          textShadow: `0px 0px 20px ${glowColor}`,
                          color: glowColor,
                        },
                      }}
                      onClick={() => {
                        // Toggle the house in the selected houses list.
                        if (isSelected) {
                          setSelectedHouses(
                            selectedHouses.filter((h) => h !== house.name)
                          );
                        } else {
                          setSelectedHouses([...selectedHouses, house.name]);
                        }
                      }}
                    >
                      {house.name}
                    </Button>
                  );
                })}
              </Box>
              <Button
                className="Create-button next"
                sx={{
                  mt: 5,
                  ml: 8,
                  color: "#ffd600",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px #ffd600",
                  boxShadow: "0 0 10px #ffd600",
                  transition: "box-shadow 0.3s ease",

                  "&:hover": {
                    boxShadow: "0 0 20px rgb(231, 112, 1)",
                    textShadow: "0px 0px 20px rgb(231, 112, 1)",
                    color: "rgb(231, 112, 1)",
                  },
                }}
                onClick={() => {
                  handlePreviewEventDarty();
                }}
              >
                Add Pairs
              </Button>
              <Button
                className="cancel-button cancel-brother"
                sx={{
                  height: 39,
                  mt: 5,
                  ml: 29,
                  color: "rgb(245, 118, 0)",
                  fontFamily: "'Lilita One', sans-serif",
                  textShadow: "0px 0px 15px rgb(245, 118, 0)",
                  boxShadow: "0 0 10px rgb(245, 118, 0)",
                  transition: "box-shadow 0.3s ease",
                  opacity: "2500%",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(224, 0, 0)",
                    textShadow: "0px 0px 20px rgb(224, 0, 0)",
                    color: "rgb(224, 0, 0)",
                  },
                }}
                color="primary"
                onClick={() => {
                  handleCancelPairsDarty();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </Box>
      )}

      {/* Day Cells */}
      <Grid container spacing={1}>
        {days.map((day) => {
          const iso = day.toISOString();
          const dayKey = format(day, "yyyy-MM-dd");

          //  Detect which events (if any) fall on this day (FILTERED)
          const todaysEvents = userVisibleEvents.filter(
            (ev) => format(ev.date, "yyyy-MM-dd") === dayKey
          );
          const hasEvents = todaysEvents.length > 0;
          const eventTypes = todaysEvents.map((ev) => ev.type);

          //  Your existing selection logic
          const isSelected = dayKey === format(currentDate, "yyyy-MM-dd");
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <Grid
              size= {{ xs: 1 }}
              key={iso}
              onClick={() => {
                setCurrentDate(day);
                if (hasEvents) openDayModal(day); // only open modal if there are events
              }}
              sx={{
                position: "relative",
                height: 150,
                width: 208,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                p: 1,
                cursor: "pointer",
                bgcolor: isCurrentMonth ? "#333333" : "#212121",
                border: isSelected ? "2px solid #ffd600" : "1px solid #555555",
                borderRadius: 2,
                transition:
                  "transform 0.1s ease, background 0.1s ease, box-shadow 0.2s ease",
                boxShadow:
                  eventTypes.length > 0
                    ? eventTypes
                        .map((type) => {
                          const glowColor =
                            type === "Philanthropy"
                              ? "#4caf50"
                              : type === "Darty"
                              ? "#ffd600"
                              : "rgb(183, 5, 228)";
                          return `0 0 8px 6px ${glowColor}`;
                        })
                        .join(", ")
                    : undefined,
                "&:hover": {
                  bgcolor: "#3d3d3d",
                  transform: "scale(1.02)",
                  outline: "2px solid #1976d2",
                  outlineOffset: "-1px",
                },
              }}
            >
              <Typography
                variant="body2"
                color={isCurrentMonth ? "#ffffff" : "#777777"}
              >
                {format(day, "d")}
              </Typography>

              {/*  Stack a tiny banner for each event type (max 3) */}
              {eventTypes.map((type, i) => {
                const badgeColor =
                  type === "Philanthropy"
                    ? "#4caf50"
                    : type === "Darty"
                    ? "#ffd600"
                    : "rgb(183, 5, 228)";
                return (
                  <Box
                    key={i}
                    sx={{
                      position: "absolute",
                      top: 4 + i * 18, // vertically offset each banner by 18px
                      left: 4,
                      bgcolor: badgeColor,
                      color: "#000",
                      px: 1.5,
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      boxShadow: `0 0 10px 6px ${badgeColor}`,
                    }}
                  >
                    {type}
                  </Box>
                );
              })}
            </Grid>
          );
        })}
      </Grid>
      <Modal
        open={!!modalDate}
        onClose={closeModal}
        BackdropProps={{ style: { backgroundColor: "rgba(0,0,0,0.5)" } }}
      >
        <Box
          sx={{
            position: "absolute" as const,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 440,
            bgcolor: "#212121",
            color: "#fff",
            p: 3,
            borderRadius: 1,
            boxShadow: `0 0 10px 6px "rgb(183, 5, 228)`,
          }}
        >
          <Typography variant="h6" gutterBottom fontFamily={"Lilita One"}>
            {modalDate && format(modalDate, "MMMM d, yyyy")}
          </Typography>

          {modalDate &&
            modalEvents.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              return (
                <Box
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  sx={{
                    mb: 3,
                    border: "1px solid rgb(208, 195, 211)",
                    p: 1,
                    borderRadius: 1,
                    height: 100,
                    bgcolor: getEventColor(ev.type),
                    color:
                      getEventColor(ev.type) === "#ffffff" ? "#000" : "#fff",
                    outline: isSelected ? "2px solid #ffffff" : "none",
                  }}
                >
                  <Typography variant="subtitle2" fontFamily={"Lilita One"}>
                    {ev.type}
                  </Typography>
                  {ev.type === "Philanthropy" ? (
                    <>
                      <Typography variant="body2" fontFamily={"Lilita One"}>
                        Name: {ev.eventName}
                      </Typography>
                      <Typography variant="body2" fontFamily={"Lilita One"}>
                        Description: {ev.eventDescription}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" fontFamily={"Lilita One"}>
                        Theme: {ev.theme}
                      </Typography>
                      <Typography variant="body2" fontFamily={"Lilita One"}>
                        Time:{" "}
                        {ev.time
                          ? `${formatTime(ev.time.start)} - ${formatTime(
                              ev.time.end
                            )}`
                          : "—"}
                      </Typography>
                      {ev.pairs?.length > 0 && (
                        <Typography variant="body2" fontFamily={"Lilita One"}>
                          Pairs: {ev.pairs.join(", ")}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              );
            })}

          <Box textAlign="center">
            <Button
              onClick={closeModal}
              sx={{
                height: 50,
                mt: 5,
                ml: 0,
                mr: 2, // added margin-right for spacing between buttons
                color: "rgb(245, 118, 0)",
                fontFamily: "'Lilita One', sans-serif",
                textShadow: "0px 0px 15px rgb(245, 118, 0)",
                boxShadow: "0 0 10px rgb(245, 118, 0)",
                transition: "box-shadow 0.3s ease",
                opacity: "2500%",
                "&:hover": {
                  boxShadow: "0 0 20px rgb(224, 0, 0)",
                  textShadow: "0px 0px 20px rgb(224, 0, 0)",
                  color: "rgb(224, 0, 0)",
                },
              }}
            >
              Close
            </Button>
            {showRemoveButton && (
              <Button
                variant="contained"
                disabled={selectedEventId === null}
                onClick={() => {
                  if (selectedEventId !== null) {
                    handleRemoveEvent(selectedEventId);
                  }
                }}
                sx={{
                  mt: 5,
                  mr: -5,
                  backgroundColor: "#1D1901",
                  color: "#1D1901",
                  fontFamily: "'Lilita One', sans-serif",
                  height: 50,
                  width: 90,
                  boxShadow: "0 0 10px #ff0000",
                  transition: "box-shadow 0.3s ease",
                  textShadow: "0px 0px 15px #ff0000",
                  "&:hover": {
                    boxShadow: "0 0 20px rgb(214, 104, 0)",
                    textShadow: "0px 0px 20px rgb(214, 104, 0)",
                  },
                }}
              >
                Remove Event
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Calendar;
