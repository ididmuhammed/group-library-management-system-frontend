import { useEffect, useState } from "react";
import { reservationApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";

const STATUS_LABEL = {
  PENDING: "Waiting for a copy",
  AVAILABLE: "Ready for pickup",
  FULFILLED: "Picked up",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const STATUS_STAMP_CLASS = {
  PENDING: "stamp stamp--pending",
  AVAILABLE: "stamp stamp--available",
  FULFILLED: "stamp stamp--available",
  CANCELLED: "stamp stamp--out",
  EXPIRED: "stamp stamp--out",
};

export default function AllReservationsPage() {
  const { notify } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await reservationApi.allReservations();
      setReservations(data);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load reservations."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(reservation) {
    if (
      !window.confirm(
        `Cancel the reservation for "${reservation.bookTitle}" (${reservation.username})?`,
      )
    )
      return;
    setBusyId(reservation.id);
    try {
      await reservationApi.cancel(reservation.id);
      notify(
        `Reservation for "${reservation.bookTitle}" cancelled.`,
        "success",
      );
      load();
    } catch (err) {
      notify(
        extractErrorMessage(err, "Could not cancel this reservation."),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }

  const active = reservations.filter(
    (r) => r.status === "PENDING" || r.status === "AVAILABLE",
  );
  const past = reservations.filter(
    (r) => r.status !== "PENDING" && r.status !== "AVAILABLE",
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Holds ledger</p>
          <h1>All reservations</h1>
        </div>
      </header>

      {loading ? (
        <PageLoader label="Checking the holds ledger…" />
      ) : (
        <>
          <section>
            <h2 className="section-heading">Active ({active.length})</h2>
            {active.length === 0 ? (
              <div className="empty-state">
                <p>No active holds right now.</p>
              </div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Member</th>
                    <th>Reserved</th>
                    <th>Status</th>
                    <th>Pickup by</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((r) => (
                    <tr key={r.id}>
                      <td>{r.bookTitle}</td>
                      <td>{r.username}</td>
                      <td>{r.reservedDate}</td>
                      <td>
                        <span className={STATUS_STAMP_CLASS[r.status]}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === "AVAILABLE" ? (
                          <span className="stamp stamp--due">
                            {r.pickupDeadline}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn--small btn--ghost"
                          disabled={busyId === r.id}
                          onClick={() => handleCancel(r)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="section-heading">Past holds</h2>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Member</th>
                    <th>Reserved</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((r) => (
                    <tr key={r.id}>
                      <td>{r.bookTitle}</td>
                      <td>{r.username}</td>
                      <td>{r.reservedDate}</td>
                      <td>
                        <span className={STATUS_STAMP_CLASS[r.status]}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
