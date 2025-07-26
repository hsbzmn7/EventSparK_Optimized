import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { fetchEvents } from "../api/events";
import { getUserBookings } from "../api/bookings";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import QRCode from "react-qr-code";
import ReactModal from "react-modal";
import { useLocation } from "react-router-dom";
import { fetchEventById } from "../api/events";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaRegCalendarAlt, FaSearch } from "react-icons/fa";

// Helper to format time to 12-hour with AM/PM
function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

// Memoized Event Card Component
const EventCard = memo(({ event, expandedEvents, setExpandedEvents, onClick }) => {
  const isLong = event.description && event.description.length > 120;
  const expanded = expandedEvents[event._id] || false;

  const handleExpandClick = useCallback((e) => {
    e.stopPropagation();
    setExpandedEvents((prev) => ({
      ...prev,
      [event._id]: !prev[event._id],
    }));
  }, [event._id, setExpandedEvents]);

  const handleCardClick = useCallback(() => {
    onClick(event._id);
  }, [event._id, onClick]);

  return (
    <div
      className="event-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow min-w-0 cursor-pointer flex flex-col"
      onClick={handleCardClick}
    >
      <div className="h-40 sm:h-48 w-full bg-slate-200 relative flex flex-col justify-end">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {event.category}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">
            {event.name}
          </h3>
          <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
            <span className="mr-2">📅</span>
            {event.date} at {formatTimeTo12Hour(event.time)}
          </div>
          <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
            <span className="mr-2">📍</span>
            {event.venue}
          </div>
          <div
            style={{
              minHeight: 48,
              maxHeight: 48,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <p
              className={`text-slate-600 text-xs sm:text-sm ${
                !expanded && isLong ? "line-clamp-2" : ""
              }`}
            >
              {event.description}
            </p>
            {isLong ? (
              <button
                className="text-blue-600 text-xs font-medium focus:outline-none mt-1"
                onClick={handleExpandClick}
              >
                {expanded ? "Show Less" : "Read More"}
              </button>
            ) : (
              <div style={{ height: 16 }} aria-hidden="true"></div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base sm:text-lg text-slate-800">
            {typeof event.ticketPrice === "number" ? `$${event.ticketPrice}` : ""}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(event._id);
            }}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
});

// Memoized Booking Card Component
const BookingCard = memo(({ booking, eventDescriptions, expandedEvents, setExpandedEvents, onViewTicket }) => {
  const event = booking.eventId || {};
  const description = event.description || eventDescriptions[event._id] || "";
  const isLong = description && description.length > 120;
  const expanded = expandedEvents[event._id] || false;

  const handleExpandClick = useCallback(() => {
    setExpandedEvents((prev) => ({
      ...prev,
      [event._id]: !prev[event._id],
    }));
  }, [event._id, setExpandedEvents]);

  const handleViewTicket = useCallback(() => {
    onViewTicket(booking);
  }, [booking, onViewTicket]);

  return (
    <div className="event-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow min-w-0">
      <div className="h-40 sm:h-48 bg-slate-200 relative flex flex-col justify-end">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="w-full flex justify-end pb-2 pr-2 absolute bottom-0 right-0">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium mb-1">
            {event.category}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">
          {event.name}
        </h3>
        <div
          style={{
            minHeight: 64,
            maxHeight: 64,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <p
            className={`text-slate-600 text-xs sm:text-sm ${
              !expanded && isLong ? "line-clamp-2" : ""
            }`}
          >
            {description}
          </p>
          {isLong ? (
            <button
              className="text-blue-600 text-xs font-medium focus:outline-none mt-1"
              onClick={handleExpandClick}
            >
              {expanded ? "Show Less" : "Read More"}
            </button>
          ) : (
            <div style={{ height: 24 }} aria-hidden="true"></div>
          )}
        </div>
        <div className="flex items-center text-xs sm:text-sm text-slate-600">
          <span className="mr-2">📅</span>
          {event.date} at {formatTimeTo12Hour(event.time)}
        </div>
        <div className="flex items-center text-xs sm:text-sm text-slate-600">
          <span className="mr-2">📍</span>
          {event.venue}
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-base sm:text-lg text-slate-800">
            {typeof booking.ticketPrice === "number" ? `$${booking.ticketPrice}` : ""}
          </span>
          <button
            onClick={handleViewTicket}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
          >
            View Ticket
          </button>
        </div>
      </div>
    </div>
  );
});

const UserDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return "browse";
  });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedEvents, setExpandedEvents] = useState({});
  const [ticketView, setTicketView] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [eventDescriptions, setEventDescriptions] = useState({});
  const [eventView, setEventView] = useState("grid");
  const [eventDateRange, setEventDateRange] = useState([null, null]);
  const [eventCalendarDate, setEventCalendarDate] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Memoized categories
  const categories = useMemo(() => [
    "All",
    "Technology",
    "Entertainment",
    "Business",
    "Arts",
    "Sports",
    "Movies",
  ], []);

  const [selectedCategory, setSelectedCategory] = useState("All");

  // Memoized status color function
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  }, []);

  // Memoized filter function
  const filterEventsByDateRange = useCallback((events, range) => {
    if (!range[0] && !range[1]) return events;
    return events.filter((ev) => {
      const evDate = new Date(ev.date);
      if (range[0] && evDate < range[0]) return false;
      if (range[1] && evDate > range[1]) return false;
      return true;
    });
  }, []);

  // Memoized format date label function
  const formatDateLabel = useCallback((dateStr) => {
    const date = new Date(dateStr);
    return (
      date.toLocaleString("en-US", { month: "short" }).toUpperCase() +
      "\n" +
      String(date.getDate()).padStart(2, "0") +
      ", " +
      date.getFullYear()
    );
  }, []);

  // Memoized approved events
  const approvedEvents = useMemo(() => 
    events.filter((ev) => ev.status === "approved"), 
    [events]
  );

  // Memoized filtered events
  const filteredEvents = useMemo(() => {
    const filtered = filterEventsByDateRange(approvedEvents, eventDateRange)
      .filter(
        (ev) =>
          (selectedCategory === "All" || ev.category === selectedCategory) &&
          (ev.name?.toLowerCase().includes(search.toLowerCase()) ||
            ev.description?.toLowerCase().includes(search.toLowerCase()) ||
            ev.venue?.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return filtered;
  }, [approvedEvents, eventDateRange, selectedCategory, search, filterEventsByDateRange]);

  // Memoized event click handler
  const handleEventClick = useCallback((eventId) => {
    window.location.href = `/event/${eventId}`;
  }, []);

  // Memoized booking click handler
  const handleBookingClick = useCallback((booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventsData, bookingsData] = await Promise.all([
          fetchEvents(),
          getUserBookings(),
        ]);
        setEvents(eventsData);
        setBookings(bookingsData);
      } catch (err) {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    // For bookings, fetch missing event descriptions
    const missing = bookings.filter(
      (b) =>
        b.eventId && !b.eventId.description && !eventDescriptions[b.eventId._id]
    );
    if (missing.length > 0) {
      missing.forEach(async (b) => {
        try {
          const event = await fetchEventById(b.eventId._id);
          setEventDescriptions((prev) => ({
            ...prev,
            [b.eventId._id]: event.description,
          }));
        } catch {}
      });
    }
  }, [bookings, eventDescriptions]);

  // Optionally, add an effect to update the tab if location.state changes after mount
  useEffect(() => {
    if (
      location.state &&
      location.state.activeTab &&
      location.state.activeTab !== activeTab
    ) {
      setActiveTab(location.state.activeTab);
    }
    // eslint-disable-next-line
  }, [location.state]);

  return (
    <div className="space-y-6 px-2 w-full" style={{ maxWidth: 1200 }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
          Discover Events
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Browse upcoming events and manage your tickets
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab("browse")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === "browse"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Browse Events
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === "tickets"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            My Tickets ({bookings.length})
          </button>
        </nav>
      </div>

      {/* Categories */}
      {activeTab === "browse" && (
        <div className="w-full flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 shadow-sm border focus:outline-none ${
                selectedCategory === category
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Browse Events Tab */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          {/* Filter Bar Card - Improved Alignment */}
          <div className="bg-white rounded-2xl shadow-md px-4 py-4 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 w-full">
              {/* Left: Date Range + View Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0 min-w-[320px]">
                {/* Date Range Picker */}
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <span className="inline-block align-middle">
                      <FaRegCalendarAlt />
                    </span>
                    Filter by Date Range
                  </label>
                  <div className="relative flex items-center">
                    <DatePicker
                      selectsRange
                      startDate={eventDateRange[0]}
                      endDate={eventDateRange[1]}
                      onChange={(update) => setEventDateRange(update)}
                      isClearable={false}
                      placeholderText="Select date range"
                      className="w-56 px-4 py-2 border border-blue-200 bg-slate-50 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      calendarClassName="z-50"
                      dateFormat="MMM d, yyyy"
                      renderCustomHeader={undefined}
                      value={
                        eventDateRange[0] && eventDateRange[1]
                          ? `${eventDateRange[0].toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} – ${eventDateRange[1].toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}`
                          : ""
                      }
                    />
                    {/* Calendar icon inside input */}
                    <span className="absolute right-3 text-blue-400 pointer-events-none">
                      <FaRegCalendarAlt />
                    </span>
                    {/* Clear button */}
                    {(eventDateRange[0] || eventDateRange[1]) && (
                      <button
                        className="absolute right-8 text-xs text-slate-500 hover:text-red-500 focus:outline-none"
                        style={{ top: "50%", transform: "translateY(-50%)" }}
                        onClick={() => setEventDateRange([null, null])}
                        tabIndex={-1}
                        aria-label="Clear date range"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    Pick a start and end date to filter events.
                  </span>
                </div>
                {/* View Toggle */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    className={`px-4 py-2 rounded-l-lg border border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                      eventView === "grid"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                    onClick={() => setEventView("grid")}
                  >
                    Grid View
                  </button>
                  <button
                    className={`px-4 py-2 rounded-r-lg border border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                      eventView === "calendar"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-blue-500 hover:bg-blue-50"
                    }`}
                    onClick={() => setEventView("calendar")}
                  >
                    Calendar View
                  </button>
                </div>
              </div>
              {/* Divider for visual grouping on desktop */}
              <div className="hidden md:block h-12 w-px bg-slate-100 mx-2" />
              {/* Middle: Category Chips */}
              {/* This block is now moved outside the tabs */}
              {/* Right: Search Bar */}
              <div className="relative w-full md:w-72 max-w-xs ml-auto flex-shrink-0 mt-2 md:mt-0">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events..."
                  className="w-full px-4 py-2 border border-blue-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                  <FaSearch />
                </span>
              </div>
            </div>
          </div>
          {/* Events Grid or Calendar View */}
          {eventView === "grid" ? (
            loading ? (
              <div className="text-center py-8 text-blue-600 font-semibold">
                Loading events...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 font-semibold">
                {error}
              </div>
            ) : (
              (() => {
                if (filteredEvents.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12">
                      <h3 className="text-lg font-medium text-slate-800 mb-1">
                        No events found
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Try a different category, search term, or date range.
                      </p>
                    </div>
                  );
                }
                // Group events by date (YYYY-MM-DD)
                const grouped = {};
                filteredEvents.forEach((ev) => {
                  const dateKey = ev.date;
                  if (!grouped[dateKey]) grouped[dateKey] = [];
                  grouped[dateKey].push(ev);
                });
                // Helper to format date for left column (e.g., JUL 25)
                const formatDateLabel = (dateStr) => {
                  const date = new Date(dateStr);
                  return (
                    date
                      .toLocaleString("en-US", { month: "short" })
                      .toUpperCase() +
                    "\n" +
                    String(date.getDate()).padStart(2, "0")
                  );
                };
                // Replace the grouped event rendering in Browse Events grid view with a responsive grid similar to My Tickets:
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        expandedEvents={expandedEvents}
                        setExpandedEvents={setExpandedEvents}
                        onClick={handleEventClick}
                      />
                    ))}
                  </div>
                );
              })()
            )
          ) : (
            // Calendar View for Events
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <Calendar
                onClickDay={(date) => {
                  const eventsForDate = filterEventsByDateRange(
                    approvedEvents,
                    eventDateRange
                  ).filter((ev) => {
                    const evDate = new Date(ev.date);
                    return (
                      evDate.getFullYear() === date.getFullYear() &&
                      evDate.getMonth() === date.getMonth() &&
                      evDate.getDate() === date.getDate()
                    );
                  });
                  if (eventsForDate.length > 0) {
                    setEventCalendarDate(date);
                    setCalendarEvents(eventsForDate);
                    setEventModalOpen(true);
                  }
                }}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const eventsForDate = filterEventsByDateRange(
                      approvedEvents,
                      eventDateRange
                    ).filter((ev) => {
                      const evDate = new Date(ev.date);
                      return (
                        evDate.getFullYear() === date.getFullYear() &&
                        evDate.getMonth() === date.getMonth() &&
                        evDate.getDate() === date.getDate()
                      );
                    });
                    const hasEvents = eventsForDate.length > 0;
                    const dotColor = hasEvents
                      ? "bg-blue-600"
                      : "bg-transparent";
                    return (
                      <div className="relative group flex flex-col items-center justify-center w-full h-full">
                        <div
                          className={`mt-1 w-2 h-2 rounded-full ${dotColor}`}
                        />
                        {/* Tooltip only for event dates */}
                        {hasEvents && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20 min-w-max">
                            <div className="text-center">
                              <div className="font-medium text-blue-200 mb-0.5">
                                {eventsForDate.length} event
                                {eventsForDate.length > 1 ? "s" : ""}
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-900"></div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <div className="mt-4">
                <span className="text-xs text-slate-500">
                  Click on a date to see events for that day.
                </span>
              </div>
              {/* Modal for events on selected date */}
              <ReactModal
                isOpen={eventModalOpen && calendarEvents.length > 0}
                onRequestClose={() => {
                  setEventModalOpen(false);
                  setCalendarEvents([]);
                }}
                ariaHideApp={false}
                className="fixed inset-0 flex items-center justify-center z-50 outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
              >
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
                    onClick={() => {
                      setEventModalOpen(false);
                      setCalendarEvents([]);
                    }}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Events for{" "}
                    {eventCalendarDate &&
                      eventCalendarDate.toLocaleDateString()}
                  </h2>
                  {calendarEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center gap-3 mb-4 p-2 rounded-lg border hover:shadow"
                    >
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {event.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          Time: {formatTimeTo12Hour(event.time)}
                        </div>
                        <div className="text-xs text-slate-600">
                          Venue: {event.venue}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          window.location.href = `/event/${event._id}`;
                        }}
                        className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </ReactModal>
            </div>
          )}
        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <button
              className={`px-4 py-2 rounded-l-lg border border-blue-500 text-sm font-medium focus:outline-none ${
                ticketView === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-blue-500"
              }`}
              onClick={() => setTicketView("list")}
            >
              Grid View
            </button>
            <button
              className={`px-4 py-2 rounded-r-lg border border-blue-500 text-sm font-medium focus:outline-none ${
                ticketView === "calendar"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-blue-500"
              }`}
              onClick={() => setTicketView("calendar")}
            >
              Calendar View
            </button>
          </div>
          {ticketView === "list" ? (
            bookings.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="max-w-md mx-auto">
                  {/* Empty State Illustration */}
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-12 h-12 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    No tickets yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Start exploring amazing events and book your first ticket to
                    see them here!
                  </p>
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Browse Events
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    eventDescriptions={eventDescriptions}
                    expandedEvents={expandedEvents}
                    setExpandedEvents={setExpandedEvents}
                    onViewTicket={handleBookingClick}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <Calendar
                onClickDay={(date) => {
                  const bookingsForDate = bookings.filter((booking) => {
                    const bookingDate = new Date(booking.eventId?.date);
                    return (
                      bookingDate.getFullYear() === date.getFullYear() &&
                      bookingDate.getMonth() === date.getMonth() &&
                      bookingDate.getDate() === date.getDate()
                    );
                  });
                  if (bookingsForDate.length > 0) {
                    setSelectedCalendarDate(date);
                    setCalendarBookings(bookingsForDate);
                    setModalOpen(true);
                  }
                }}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const bookingsForDate = bookings.filter((booking) => {
                      const bookingDate = new Date(booking.eventId?.date);
                      return (
                        bookingDate.getFullYear() === date.getFullYear() &&
                        bookingDate.getMonth() === date.getMonth() &&
                        bookingDate.getDate() === date.getDate()
                      );
                    });
                    const hasTickets = bookingsForDate.length > 0;
                    const dotColor = hasTickets
                      ? "bg-red-600"
                      : "bg-transparent";
                    return (
                      <div className="relative group flex flex-col items-center justify-center w-full h-full">
                        <div
                          className={`mt-1 w-2 h-2 rounded-full ${dotColor}`}
                        />
                        {/* Tooltip only for ticket dates */}
                        {hasTickets && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20 min-w-max">
                            <div className="text-center">
                              <div className="font-medium text-red-200 mb-0.5">
                                {bookingsForDate.length} ticket
                                {bookingsForDate.length > 1 ? "s" : ""}
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-900"></div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                tileClassName={({ date, view }) => {
                  // No custom background/text classes for ticket dates
                  return null;
                }}
              />
              <div className="mt-4">
                <span className="text-xs text-slate-500">
                  Click on a date to see your bookings for that day.
                </span>
              </div>
            </div>
          )}
          {/* Ticket Details Modal */}
          <ReactModal
            isOpen={
              modalOpen && !!selectedBooking && calendarBookings.length === 0
            }
            onRequestClose={() => {
              setModalOpen(false);
              setSelectedBooking(null);
            }}
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50 outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
          >
            {selectedBooking && (
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                {selectedBooking.eventId?.imageUrl && (
                  <img
                    src={selectedBooking.eventId.imageUrl}
                    alt={selectedBooking.eventId.name}
                    className="w-full h-40 object-cover rounded-lg mb-4 border"
                  />
                )}
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {selectedBooking.eventId?.name}
                </h2>
                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <span className="mr-2">📅</span>
                  {selectedBooking.eventId?.date} at{" "}
                  {formatTimeTo12Hour(selectedBooking.eventId?.time)}
                </div>
                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <span className="mr-2">📍</span>
                  {selectedBooking.eventId?.venue}
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Seat:</span>
                  <span className="font-medium text-slate-800">
                    {selectedBooking.seatNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-medium text-slate-800">
                    ${selectedBooking.ticketPrice}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Payment:</span>
                  <span
                    className={`font-medium ${getStatusColor(
                      selectedBooking.paymentStatus
                    )}`}
                  >
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
                <div className="flex flex-col items-center mt-4">
                  <span className="text-xs text-slate-500 mb-1">QR Code</span>
                  <div className="bg-white p-2 rounded border w-32 h-32 flex items-center justify-center">
                    <QRCode value={selectedBooking.qrCode || ""} size={128} />
                  </div>
                </div>
              </div>
            )}
          </ReactModal>
          {/* Calendar Bookings Modal */}
          <ReactModal
            isOpen={modalOpen && calendarBookings.length > 0}
            onRequestClose={() => {
              setModalOpen(false);
              setCalendarBookings([]);
            }}
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50 outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
                onClick={() => {
                  setModalOpen(false);
                  setCalendarBookings([]);
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Bookings for{" "}
                {selectedCalendarDate &&
                  selectedCalendarDate.toLocaleDateString()}
              </h2>
              {calendarBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex items-center gap-3 mb-4 p-2 rounded-lg border hover:shadow"
                >
                  {booking.eventId?.imageUrl && (
                    <img
                      src={booking.eventId.imageUrl}
                      alt={booking.eventId.name}
                      className="w-12 h-12 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {booking.eventId?.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      Seat: {booking.seatNumber}
                    </div>
                    <div className="text-xs text-slate-600">
                      Time: {formatTimeTo12Hour(booking.eventId?.time)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setCalendarBookings([]);
                      setModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    View Ticket
                  </button>
                </div>
              ))}
            </div>
          </ReactModal>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
