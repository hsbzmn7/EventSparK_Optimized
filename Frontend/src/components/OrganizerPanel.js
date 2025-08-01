import React, { useState, useEffect } from "react";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import DeleteEventModal from "./DeleteEventModal";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchOrganizerEvents,
} from "../api/events";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const OrganizerPanel = ({ user }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventView, setEventView] = useState("list");
  const [eventSearch, setEventSearch] = useState("");
  const [calendarDateRange, setCalendarDateRange] = useState([null, null]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    fetchOrganizerEvents(user._id)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEvents(data.events);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);
  const [error, setError] = useState(null);

  // Fetch events from backend
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrganizerEvents(user._id);
      setEvents(data);
    } catch (err) {
      setError("Failed to load events");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadEvents();
  }, []);

  // Add event handler
  const handleAddEvent = async (formData) => {
    try {
      await createEvent(formData);
      setShowAddModal(false);
      loadEvents();
      toast.info("Event is waiting for admin approval.");
    } catch (err) {
      toast.error("Failed to create event");
    }
  };

  // Edit event handler
  const handleEditEventSubmit = async (formData) => {
    try {
      await updateEvent(selectedEvent._id, formData);
      setShowEditModal(false);
      setSelectedEvent(null);
      loadEvents();
      toast.success("Event updated successfully!");
    } catch (err) {
      toast.error("Failed to update event");
    }
  };

  // Delete event handler
  const handleDeleteEventConfirm = async () => {
    try {
      await deleteEvent(selectedEvent._id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      loadEvents();
      toast.success("Event deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete event");
    }
  };

  // Sell tickets handler (for testing)
  const handleSellTickets = async (event) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/events/${event._id}/sell-tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ quantity: 1 }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadEvents();
        toast.success(`Ticket sold for $${data.data.ticketPrice}!`);
      } else {
        toast.error(data.message || "Failed to sell ticket");
      }
    } catch (err) {
      toast.error("Failed to sell ticket");
    }
  };

  // Calculate KPIs
  const now = new Date();
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => {
    if (!e.date) return false;
    // Combine date and time for accurate comparison
    const eventDateTime = new Date(`${e.date}T${e.time || "00:00"}`);
    return eventDateTime > now;
  }).length;
  const totalRevenue = events.reduce(
    (sum, e) => sum + (typeof e.revenue === "number" ? e.revenue : 0),
    0
  );
  const totalAttendees = events.reduce(
    (sum, e) =>
      sum +
      (Array.isArray(e.attendees) ? e.attendees.length : e.attendees ?? 0),
    0
  );

  const stats = [
    { title: "Total Events", value: events.length },
    {
      title: "Active Events",
      value: events.filter((e) => e.status === "active").length,
    },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}` },
    {
      title: "Total Attendees",
      value: events.reduce((sum, e) => sum + (e.attendees || 0), 0),
    },
  ];

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Filter events for search
  const filteredEvents = events.filter((ev) => {
    const search = eventSearch.toLowerCase();
    return (
      ev.name?.toLowerCase().includes(search) ||
      ev.description?.toLowerCase().includes(search) ||
      ev.venue?.toLowerCase().includes(search) ||
      (ev.organizer?.name?.toLowerCase() || "").includes(search) ||
      (ev.organizer?.email?.toLowerCase() || "").includes(search) ||
      (ev.createdBy?.name?.toLowerCase() || "").includes(search) ||
      (ev.createdBy?.email?.toLowerCase() || "").includes(search)
    );
  });

  return (
    <>
      <div className="space-y-6 w-full px-0" style={{ maxWidth: "100%" }}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
              Event Management
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Create and manage your events
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 text-xs sm:text-sm"
          >
            <span>+</span>
            <span>Add Event</span>
          </button>
          <AddEventModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddEvent}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
              Total Events
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {loading ? "..." : totalEvents}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
              Active Events
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {loading ? "..." : activeEvents}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
              Total Revenue
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {loading ? "..." : `$${totalRevenue.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
              Total Attendees
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {loading ? "..." : totalAttendees}
            </p>
          </div>
        </div>

        {/* Events Table */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex gap-2">
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
              className={`px-4 py-2 border-t border-b border-blue-500 text-sm font-medium focus:outline-none transition-colors duration-150 ${
                eventView === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"
              }`}
              onClick={() => setEventView("list")}
            >
              List View
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
          <div className="relative w-full md:w-72 max-w-xs ml-auto flex-shrink-0 mt-2 md:mt-0">
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Search events, details, organizer..."
              className="w-full px-4 py-2 border border-blue-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
              <FaSearch />
            </span>
          </div>
        </div>
        {/* Render based on eventView */}
        {eventView === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="event-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow min-w-0 cursor-pointer flex flex-col"
                onClick={() =>
                  (window.location.href = `/organizer/event/${event._id}`)
                }
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
                      {event.status !== "approved" && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold align-middle">
                          Pending
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
                      <span className="mr-2">📅</span>
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
                      <span className="mr-2">📍</span>
                      {event.venue}
                    </div>
                    <div className="text-slate-600 text-xs sm:text-sm mb-2 line-clamp-2">
                      {event.description}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base sm:text-lg text-slate-800">
                      {typeof event.ticketPrice === "number"
                        ? `$${event.ticketPrice}`
                        : ""}
                    </span>
                    <span className="text-xs text-slate-600">
                      {event.soldTickets || 0}/{event.totalSeats || 0} sold
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 transition-colors text-xs sm:text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {eventView === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Your Events
              </h2>
            </div>
            <div>
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Event
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Date & Time
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Venue
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Ticket Price
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Sold/Available
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Revenue
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="event-card hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/organizer/event/${event._id}`)
                      }
                    >
                      <td className="px-4 sm:px-6 py-3 whitespace-normal">
                        <div>
                          <div className="font-medium text-slate-800">
                            {event.name}
                          </div>
                          <div className="text-slate-500">{event.category}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal">
                        <div className="text-slate-800">{event.date}</div>
                        <div className="text-slate-500">{event.time}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                        {event.venue}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal">
                        {event.status === "approved" ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                        <div className="font-medium">
                          ${event.ticketPrice || 0}
                        </div>
                        {event.dynamicPricing?.enabled && (
                          <div className="text-xs text-slate-500">
                            Dynamic pricing enabled
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                        {event.soldTickets || 0}/
                        {event.totalSeats || event.capacity || 0}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal font-medium text-slate-800">
                        ${(event.revenue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-normal font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors text-xs sm:text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {eventView === "calendar" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <Calendar
              onClickDay={(date) => {
                const eventsForDate = filteredEvents.filter((ev) => {
                  const evDate = new Date(ev.date);
                  return (
                    evDate.getFullYear() === date.getFullYear() &&
                    evDate.getMonth() === date.getMonth() &&
                    evDate.getDate() === date.getDate()
                  );
                });
                if (eventsForDate.length > 0) {
                  setCalendarDateRange([date, date]);
                  setCalendarEvents(eventsForDate);
                }
              }}
              value={calendarDateRange[0]}
              tileContent={({ date, view }) => {
                if (view === "month") {
                  const eventsForDate = filteredEvents.filter((ev) => {
                    const evDate = new Date(ev.date);
                    return (
                      evDate.getFullYear() === date.getFullYear() &&
                      evDate.getMonth() === date.getMonth() &&
                      evDate.getDate() === date.getDate()
                    );
                  });
                  const hasEvents = eventsForDate.length > 0;
                  const dotColor = hasEvents ? "bg-blue-600" : "bg-transparent";
                  return (
                    <div className="relative group flex flex-col items-center justify-center w-full h-full">
                      <div
                        className={`mt-1 w-2 h-2 rounded-full ${dotColor}`}
                      />
                      {hasEvents && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20 min-w-max">
                          <div className="text-center">
                            <div className="font-medium text-blue-200 mb-0.5">
                              {eventsForDate.length} event
                              {eventsForDate.length > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-900"></div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Show events for selected date below calendar */}
            {calendarEvents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Events on {calendarDateRange[0]?.toLocaleDateString()}
                </h3>
                <ul className="space-y-2">
                  {calendarEvents.map((ev) => (
                    <li
                      key={ev._id}
                      className="event-card bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow min-w-0 cursor-pointer p-4"
                      onClick={() =>
                        (window.location.href = `/organizer/event/${ev._id}`)
                      }
                    >
                      <div className="font-semibold text-slate-800">
                        {ev.name}
                      </div>
                      <div className="text-xs text-slate-600">{ev.venue}</div>
                      <div className="text-xs text-slate-600">
                        {ev.date} at {ev.time}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddEventModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddEvent}
          />
        )}

        {showEditModal && selectedEvent && (
          <EditEventModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            event={selectedEvent}
            onSubmit={handleEditEventSubmit}
          />
        )}

        {showDeleteModal && selectedEvent && (
          <DeleteEventModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            event={selectedEvent}
            onConfirm={handleDeleteEventConfirm}
          />
        )}
      </div>
    </>
  );
};

export default OrganizerPanel;
