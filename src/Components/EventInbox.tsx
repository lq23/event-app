import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, CardActions, Typography, Button, Chip, Stack, Divider } from "@mui/material";
import { format } from "date-fns";
import { useUser } from "./UserContext";
// import your initialized client
import { supabase } from "../supabase";

type EventType = "Darty" | "Night Party" | "Philanthropy";
type Status = "pending" | "approved" | "declined";

// MUST match your Supabase columns exactly
type EventRequestRow = {
  id: number;
  type: EventType;
  date: string;                 // ISO date (e.g. "2025-08-18")
  theme: string | null;
  pairs: string[] | null;       // jsonb[] in Supabase
  message: string | null;
  from_role: string;
  from_house: string | null;
  to_house: string;
  submitted_at: string;         // ISO datetime
  status: Status;
  sender_id: string | null;
};

function normalizeHouseKey(input: string): string {
  return String(input).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const FRAT_KEYS = new Set([
  "THETA_CHI","DKE","DU","ZBT","AEPI","SAE","PIKE","SAMMY","TKE","PSI_U","SIG_CHI","DTD"
]);

function getUserHouseKey(roleRaw: string): string | null {
  const ROLE = normalizeHouseKey(roleRaw);
  const m = ROLE.match(/^(.*)_(SOCIAL|BROTHER)$/);
  const house = normalizeHouseKey(m ? m[1] : ROLE);
  return FRAT_KEYS.has(house) ? house : null;
}

const TABLE = "event_requests"; // rename if your table is different

const EventInbox: React.FC = () => {
  const { currentUser } = useUser();
  if (!currentUser) return <p>Loading...</p>;

  const ROLE = String(currentUser.role || "").trim().toUpperCase();
  const isOwner  = ROLE === "OWNER";
  const isBluech = ROLE === "BLUECH_SOCIAL";
  const myFrat   = getUserHouseKey(ROLE);
  const isFratSocial = ROLE.endsWith("_SOCIAL") && !!myFrat;

  const [rows, setRows] = useState<EventRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch once
  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();

    // Realtime updates
    const channel = supabase
      .channel("event-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Who can see what
  const visible = useMemo(() => {
    if (isOwner || isBluech) return rows;
    if (isFratSocial && myFrat) return rows.filter(r => r.to_house === myFrat);
    return [];
  }, [rows, isOwner, isBluech, isFratSocial, myFrat]);

  const canAct = (r: EventRequestRow) =>
    isOwner || isBluech || (isFratSocial && myFrat === r.to_house);

  async function approve(r: EventRequestRow) {
    if (!canAct(r)) return;
    const { error } = await supabase
      .from(TABLE)
      .update({ status: "approved" satisfies Status })
      .eq("id", r.id);
    if (!error) fetchRequests();
  }

  async function decline(r: EventRequestRow) {
    if (!canAct(r)) return;
    const { error } = await supabase
      .from(TABLE)
      .update({ status: "declined" satisfies Status })
      .eq("id", r.id);
    if (!error) fetchRequests();
  }

  // Dev helper: seed one row in Supabase (safe to remove)
  async function seed() {
    const sample: Omit<EventRequestRow, "id"> = {
      type: "Night Party",
      date: new Date().toISOString().slice(0, 10),
      theme: "Neon Night",
      pairs: ["KKG", "APHI"],
      message: "Joint party at SIG_CHI?",
      from_role: "KKG_SOCIAL",
      from_house: "KKG",
      to_house: "SIG_CHI",
      submitted_at: new Date().toISOString(),
      status: "pending",
      sender_id: currentUser ? currentUser.id ?? null : null,
    };
    await supabase.from(TABLE).insert(sample);
  }

  return (
    <Box sx={{ mt: -27, ml: 5, p: 2, bgcolor: "#212121", color: "#fff", borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ fontFamily: "'Lilita One', sans-serif" }}>
          Event Requests Inbox
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`Pending ${visible.filter(v => v.status === "pending").length}`} />
          <Chip label={`Approved ${visible.filter(v => v.status === "approved").length}`} />
          <Chip label={`Declined ${visible.filter(v => v.status === "declined").length}`} />
          {/* <Button size="small" onClick={seed}>Seed one</Button> */}
        </Stack>
      </Stack>

      {loading ? (
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Loading…</Typography>
      ) : !visible.length ? (
        <Typography variant="body2" sx={{ opacity: 0.8 }}>No requests yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {visible.map((r) => (
            <Card key={r.id} sx={{ bgcolor: "#2b2b2b", border: "1px solid #444" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontFamily: "'Lilita One', sans-serif" }}>
                    {r.type} • {r.theme || "Untitled"}
                  </Typography>
                  <Chip
                    label={r.status.toUpperCase()}
                    color={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "default"}
                    variant="outlined"
                  />
                </Stack>
                {/* The Stack component below is responsible for layout orientation */}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip label={r.type} color="primary" />
                  {r.theme && <Chip label={r.theme} color="secondary" />}
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  For: <b>{r.to_house}</b> • From: <b>{r.from_house || r.from_role}</b>
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Event Date: {format(new Date(r.date), "MMM d, yyyy")}
                </Typography>
                {r.pairs?.length ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Pairs: {r.pairs.join(", ")}
                  </Typography>
                ) : null}
                {r.message && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    “{r.message}”
                  </Typography>
                )}
                <Divider sx={{ my: 1.5, borderColor: "#444" }} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Submitted {format(new Date(r.submitted_at), "MMM d, yyyy h:mma")}
                </Typography>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  disabled={!canAct(r) || r.status !== "pending"}
                  onClick={() => approve(r)}
                  sx={{ mr: 1, bgcolor: "#1D1901", color: "#ffd600" }}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  disabled={!canAct(r) || r.status !== "pending"}
                  onClick={() => decline(r)}
                  sx={{ borderColor: "#ff6b6b", color: "#ff6b6b" }}
                >
                  Decline
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default EventInbox;
