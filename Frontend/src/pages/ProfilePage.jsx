import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { getUserBookings } from "../api/bookings";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const PenIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width={18}
    height={18}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-6H3v6z"
    />
  </svg>
);

const ProfilePage = ({ user, setUser }) => {
  const [editField, setEditField] = useState("");
  const [form, setForm] = useState({
    username: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    profilePic: null,
  });
  const [preview, setPreview] = useState(user?.profilePic || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPrevious, setShowPrevious] = useState(false);
  const ticketPreviewRef = useRef();
  const [ticketToDownload, setTicketToDownload] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError("");
      try {
        const data = await getUserBookings();
        setBookings(data.data || data.bookings || data || []);
      } catch (err) {
        setBookingsError(err?.toString() || "Failed to fetch bookings");
      } finally {
        setBookingsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save handler for each field
  const handleSave = async (field) => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      if (field === "username" && form.username !== user.name)
        formData.append("name", form.username);
      if (field === "email" && form.email !== user.email)
        formData.append("email", form.email); // backend may not support email change
      if (field === "phone" && form.phone !== user.phoneNumber)
        formData.append("phoneNumber", form.phone); // ensure phoneNumber is used
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(res.data.data.user);
      setMessage("Profile updated successfully!");
      setEditField("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Profile image upload handler
  const handleProfilePicClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("profilePic", file);
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(res.data.data.user);
      setMessage("Profile picture updated!");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update profile picture."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditField("");
    setForm({
      username: user?.name || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      profilePic: null,
    });
    setPreview(user?.profilePic || "");
    setMessage("");
    setError("");
  };

  // Segregate bookings
  const currentBookings = bookings.filter(
    (b) => (b.status || "").toLowerCase() !== "inactive"
  );
  const previousBookings = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "inactive"
  );

  const downloadTicket = async (booking, event) => {
    setTicketToDownload({ booking, event });
    setTimeout(async () => {
      const input = ticketPreviewRef.current;
      if (!input) return;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      // Center the ticket on the page
      const x = (pdf.internal.pageSize.getWidth() - 350) / 2;
      pdf.addImage(imgData, "PNG", x, 40, 350, 340);
      pdf.save(`${event?.name || "ticket"}_${booking.seatNumber}.pdf`);
      setTicketToDownload(null);
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Replace the blue header with a white top bar and gradient background like the dashboard */}
      <header className="bg-white shadow-sm border-b border-slate-200 w-full">
        <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div
            className="flex items-center space-x-3 h-16 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Logo size={40} />
          </div>
        </div>
      </header>
      {/* Profile Heading */}
      <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-8 mb-4">
        <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
      </div>
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl mx-auto -mt-12 p-8 flex flex-col items-center border border-slate-100">
        {/* Profile Image */}
        <div className="relative mb-4">
          <div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden cursor-pointer group"
            onClick={handleProfilePicClick}
            title="Change Profile Picture"
            style={{ position: "relative" }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl text-white opacity-80">
                +
                <svg
                  className="inline w-10 h-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                </svg>
              </span>
            )}
            <button
              className="absolute bottom-1 right-1 bg-white border-2 border-blue-500 rounded-full p-1 shadow-md hover:bg-blue-50 transition-colors"
              style={{ zIndex: 2 }}
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handleProfilePicClick();
              }}
            >
              <PenIcon className="w-4 h-4 text-blue-500" />
            </button>
            <input
              type="file"
              name="profilePic"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleProfilePicChange}
            />
          </div>
        </div>
        {/* Greeting */}
        <div className="text-xl font-semibold mb-6">Hi, {user?.name}</div>
        {/* Info Rows */}
        <div className="w-full max-w-xl space-y-4">
          {/* Username */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Username</div>
              {editField === "username" ? (
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="mt-1 px-3 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  minLength={2}
                  maxLength={50}
                />
              ) : (
                <span className="text-slate-900 font-semibold">
                  {user?.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {editField === "username" ? (
                <>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium mr-2"
                    onClick={() => handleSave("username")}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditField("username")}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full flex items-center justify-center focus:outline-none"
                  title="Edit Username"
                  aria-label="Edit Username"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {/* Email */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Email Address</div>
              <span className="text-slate-900 font-semibold">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {/* Email edit not implemented, so no edit button */}
            </div>
          </div>
          {/* Phone Number */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium text-slate-700">Mobile Number</div>
              {editField === "phone" ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 px-3 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  minLength={8}
                  maxLength={20}
                />
              ) : (
                <span className="text-slate-900 font-semibold">
                  {user?.phoneNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xs font-semibold">
                Verified
              </span>
              {editField === "phone" ? (
                <>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium mr-2"
                    onClick={() => handleSave("phone")}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditField("phone")}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full flex items-center justify-center focus:outline-none"
                  title="Edit Phone Number"
                  aria-label="Edit Phone Number"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Success/Error Message */}
        {message && (
          <div className="text-green-600 text-sm mt-4">{message}</div>
        )}
        {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      </div>
      {/* Bookings Section */}
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow p-8 border border-slate-100">
        {/* Expandable Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              showCurrent
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-slate-500 bg-white"
            }`}
            onClick={() => {
              setShowCurrent(true);
              setShowPrevious(false);
            }}
          >
            My Bookings ({currentBookings.length})
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              showPrevious
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-slate-500 bg-white"
            }`}
            onClick={() => {
              setShowPrevious(true);
              setShowCurrent(false);
            }}
          >
            Previous Bookings ({previousBookings.length})
          </button>
        </div>
        {/* My Bookings */}
        {showCurrent &&
          (bookingsLoading ? (
            <div className="text-blue-600">Loading bookings...</div>
          ) : bookingsError ? (
            <div className="text-red-600">{bookingsError}</div>
          ) : currentBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">No bookings found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentBookings.map((booking) => {
                const event = booking.eventId || booking.event;
                return (
                  <div
                    key={booking._id}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col shadow-md"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={event?.imageUrl || "/logo.png"}
                        alt={event?.name || "Event"}
                        className="w-20 h-20 object-cover rounded-lg border border-blue-200"
                      />
                      <div>
                        <div className="font-bold text-blue-800 text-lg">
                          {event?.name}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          {event?.date} {event?.time && `at ${event.time}`}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Venue: {event?.venue}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Seat: {booking.seatNumber}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Price: ${booking.ticketPrice}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Status: {booking.status || "Confirmed"}
                      </span>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                          booking.paymentStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        Payment:{" "}
                        {booking.paymentStatus === "completed"
                          ? "Paid"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                      <QRCodeSVG value={booking.qrCode} size={96} />
                      <div className="text-xs text-slate-500 mt-2">
                        Booking Date:{" "}
                        {new Date(
                          booking.bookingDate || booking.createdAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => downloadTicket(booking, event)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm inline-block w-fit"
                      >
                        Download Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        {/* Previous Bookings */}
        {showPrevious &&
          (bookingsLoading ? (
            <div className="text-blue-600">Loading bookings...</div>
          ) : bookingsError ? (
            <div className="text-red-600">{bookingsError}</div>
          ) : previousBookings.length === 0 ? (
            <div className="text-slate-500 text-sm">
              No previous bookings found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previousBookings.map((booking) => {
                const event = booking.eventId || booking.event;
                return (
                  <div
                    key={booking._id}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col shadow-md"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={event?.imageUrl || "/logo.png"}
                        alt={event?.name || "Event"}
                        className="w-20 h-20 object-cover rounded-lg border border-blue-200"
                      />
                      <div>
                        <div className="font-bold text-blue-800 text-lg">
                          {event?.name}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          {event?.date} {event?.time && `at ${event.time}`}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Venue: {event?.venue}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Seat: {booking.seatNumber}
                        </div>
                        <div className="text-slate-700 text-sm mb-1">
                          Price: ${booking.ticketPrice}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Status: {booking.status || "Confirmed"}
                      </span>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                          booking.paymentStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        Payment:{" "}
                        {booking.paymentStatus === "completed"
                          ? "Paid"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                      <QRCodeSVG value={booking.qrCode} size={96} />
                      <div className="text-xs text-slate-500 mt-2">
                        Booking Date:{" "}
                        {new Date(
                          booking.bookingDate || booking.createdAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => downloadTicket(booking, event)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm inline-block w-fit"
                      >
                        Download Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
      </div>
      {ticketToDownload && (
        <div style={{ position: "absolute", left: -9999, top: 0 }}>
          <div
            ref={ticketPreviewRef}
            style={{
              width: 350,
              padding: 20,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e0e7ef",
              fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 22,
                color: "#2563eb",
                marginBottom: 8,
              }}
            >
              Event Ticket
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
              {ticketToDownload.event?.name}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Date: {ticketToDownload.event?.date}{" "}
              {ticketToDownload.event?.time &&
                `at ${ticketToDownload.event.time}`}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Venue: {ticketToDownload.event?.venue}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Seat: {ticketToDownload.booking.seatNumber}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Price: ${ticketToDownload.booking.ticketPrice}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Status: {ticketToDownload.booking.status || "Confirmed"}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Payment:{" "}
              {ticketToDownload.booking.paymentStatus === "completed"
                ? "Paid"
                : "Pending"}
            </div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>
              Booking Date:{" "}
              {new Date(
                ticketToDownload.booking.bookingDate ||
                  ticketToDownload.booking.createdAt
              ).toLocaleDateString()}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <QRCodeSVG value={ticketToDownload.booking.qrCode} size={140} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
