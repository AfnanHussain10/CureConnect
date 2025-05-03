"use client"

import { useState } from "react"
import {
  Calendar,
  Star,
  Clock,
  Edit,
  Search,
  CalendarIcon,
  ClockIcon,
  FileText,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { toast } from "../components/ui/use-toast"
import * as api from "../services/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "../components/ui/label"

function AppointmentManagement({
  upcomingAppointments,
  pastAppointments,
  setUpcomingAppointments,
  setPastAppointments,
  token,
}) {
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" })
  const [editData, setEditData] = useState({ symptoms: "", notes: "" })
  const [feedbackData, setFeedbackData] = useState({ rating: 0, comment: "" })
  const [availableTimes, setAvailableTimes] = useState([])
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)
  const [modalError, setModalError] = useState(null)

  // State for pagination and filtering
  const [currentPageUpcoming, setCurrentPageUpcoming] = useState(1)
  const [currentPagePast, setCurrentPagePast] = useState(1)
  const [appointmentsPerPage] = useState(5)
  const [searchTermUpcoming, setSearchTermUpcoming] = useState("")
  const [searchTermPast, setSearchTermPast] = useState("")
  const [filterStatusUpcoming, setFilterStatusUpcoming] = useState("all")
  const [filterStatusPast, setFilterStatusPast] = useState("all")
  const [activeTab, setActiveTab] = useState("upcoming")

  // Generate time slots from 9:00 AM to 5:00 PM with 30-minute intervals in AM/PM format
  const generateTimeSlots = () => {
    const times = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break
        const period = hour >= 12 ? "PM" : "AM"
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const time = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`
        times.push(time)
      }
    }
    return times
  }

  // Convert 24-hour time to AM/PM format (if backend returns HH:MM)
  const toAmPmFormat = (time) => {
    if (!time || !time.includes(":")) return ""
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Fetch available time slots for a given date and doctor
  const fetchAvailableTimes = async (date, doctorId) => {
    setIsLoadingTimes(true)
    try {
      const response = await fetch(`http://localhost:5000/api/appointments?doctorId=${doctorId}&date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to fetch appointments")

      const bookedTimes = data.data.filter((app) => app.status !== "cancelled" && app._id !== selectedAppointment?._id)

      const allTimes = generateTimeSlots()
      const available = allTimes.filter((time) => !bookedTimes.includes(time))
      setAvailableTimes(available)

      setRescheduleData((prev) => ({ ...prev, time: available[0] || "" }))
    } catch (error) {
      console.error("Failed to fetch available times:", error)
      toast({
        title: "Error",
        description: "Failed to load available times. Please try again.",
        variant: "destructive",
      })
      setAvailableTimes([])
    } finally {
      setIsLoadingTimes(false)
    }
  }

  // Handle date change in reschedule modal
  const handleDateChange = (date) => {
    setRescheduleData({ ...rescheduleData, date })
    if (date && selectedAppointment) {
      fetchAvailableTimes(date, selectedAppointment.doctorId._id)
    }
  }

  // Open reschedule modal
  const handleRescheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    const date = new Date(appointment.date).toISOString().split("T")[0]
    setRescheduleData({ date, time: appointment.time })
    setIsRescheduleDialogOpen(true)
    fetchAvailableTimes(date, appointment.doctorId._id)
  }

  // Open edit modal
  const handleEditAppointment = (appointment) => {
    try {
      if (!appointment) {
        throw new Error("No appointment selected")
      }
      setSelectedAppointment(appointment)
      setEditData({
        symptoms: appointment.symptoms || "",
        notes: appointment.notes || "",
      })
      setModalError(null)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("Error opening edit modal:", error)
      toast({
        title: "Error",
        description: "Failed to open edit modal. Please try again.",
        variant: "destructive",
      })
      setModalError(error.message)
    }
  }

  // Handle edit data change
  const handleEditDataChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  // Submit reschedule
  const handleSubmitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast({
        title: "Error",
        description: "Please select both date and time.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await api.rescheduleAppointment(
        selectedAppointment._id,
        { date: rescheduleData.date, time: rescheduleData.time },
        token,
      )

      setUpcomingAppointments((prev) =>
        prev.map((app) =>
          app._id === selectedAppointment._id ? { ...app, date: response.data.date, time: response.data.time } : app,
        ),
      )

      toast({
        title: "Appointment Rescheduled",
        description: "Your appointment has been rescheduled successfully.",
      })
      setIsRescheduleDialogOpen(false)
      setRescheduleData({ date: "", time: "" })
      setSelectedAppointment(null)
      setAvailableTimes([])
    } catch (error) {
      console.error("Failed to reschedule appointment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!editData.symptoms.trim() && !editData.notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide at least one field to update.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await api.editAppointmentDetails(
        selectedAppointment._id,
        { symptoms: editData.symptoms, notes: editData.notes },
        token,
      )

      setUpcomingAppointments((prev) =>
        prev.map((app) =>
          app._id === selectedAppointment._id
            ? { ...app, symptoms: response.data.symptoms, notes: response.data.notes }
            : app,
        ),
      )

      setPastAppointments((prev) =>
        prev.map((app) =>
          app._id === selectedAppointment._id
            ? { ...app, symptoms: response.data.symptoms, notes: response.data.notes }
            : app,
        ),
      )

      toast({
        title: "Appointment Updated",
        description: "Your appointment details have been updated successfully.",
      })
      setIsEditDialogOpen(false)
      setEditData({ symptoms: "", notes: "" })
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Failed to edit appointment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment details. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Cancel appointment
  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.cancelAppointment(appointmentId, token)

      setUpcomingAppointments((prev) => {
        const cancelled = prev.find((app) => app._id === appointmentId)
        const updated = prev.filter((app) => app._id !== appointmentId)
        if (cancelled) {
          cancelled.status = "cancelled"
          setPastAppointments((prevPast) => [...prevPast, cancelled])
        }
        return updated
      })

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      })
    } catch (error) {
      console.error("Failed to cancel appointment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to open feedback modal
  const handleOpenFeedbackModal = (appointment) => {
    setSelectedAppointment(appointment)
    setFeedbackData({ rating: appointment.feedback?.rating || 0, comment: appointment.feedback?.comment || "" })
    setIsFeedbackDialogOpen(true)
  }

  // Function to handle feedback data change
  const handleFeedbackDataChange = (field, value) => {
    setFeedbackData((prev) => ({ ...prev, [field]: value }))
  }

  // Function to submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackData.rating || !feedbackData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please provide both rating and comment.",
        variant: "destructive",
      })
      return
    }

    try {
      const reviewData = {
        appointmentId: selectedAppointment._id,
        rating: parseInt(feedbackData.rating),
        comment: feedbackData.comment.trim(),
      };

      const response = await api.createReview(reviewData, token);

      setPastAppointments((prev) =>
        prev.map((app) => (app._id === selectedAppointment._id ? { ...app, review: response.data } : app)),
      )

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      })
      setIsFeedbackDialogOpen(false)
      setFeedbackData({ rating: 0, comment: "" })
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter and search appointments
  const filterAppointments = (appointments, searchTerm, filterStatus) => {
    let filtered = appointments

    // Search by doctor name or specialization
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.doctorId.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((app) => app.status === filterStatus)
    }

    return filtered
  }

  // Pagination logic
  const paginate = (appointments, pageNumber) => {
    const startIndex = (pageNumber - 1) * appointmentsPerPage
    return appointments.slice(startIndex, startIndex + appointmentsPerPage)
  }

  // Get filtered and paginated appointments
  const filteredUpcomingAppointments = filterAppointments(
    upcomingAppointments,
    searchTermUpcoming,
    filterStatusUpcoming,
  )
  const filteredPastAppointments = filterAppointments(pastAppointments, searchTermPast, filterStatusPast)

  const paginatedUpcomingAppointments = paginate(filteredUpcomingAppointments, currentPageUpcoming)
  const paginatedPastAppointments = paginate(filteredPastAppointments, currentPagePast)

  const totalPagesUpcoming = Math.ceil(filteredUpcomingAppointments.length / appointmentsPerPage)
  const totalPagesPast = Math.ceil(filteredPastAppointments.length / appointmentsPerPage)

  // Handle page change
  const handlePageChange = (section, page) => {
    if (section === "upcoming") {
      setCurrentPageUpcoming(page)
    } else {
      setCurrentPagePast(page)
    }
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        )
    }
  }

  // Get doctor initials for avatar
  const getDoctorInitials = (name) => {
    if (!name) return "DR"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming" className="text-base">
            Upcoming Appointments
          </TabsTrigger>
          <TabsTrigger value="past" className="text-base">
            Past Appointments
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by doctor or specialization..."
                value={searchTermUpcoming}
                onChange={(e) => setSearchTermUpcoming(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatusUpcoming} onValueChange={setFilterStatusUpcoming}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredUpcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No upcoming appointments found</p>
              <p className="text-gray-400 text-sm mt-1">Schedule a new appointment to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedUpcomingAppointments.map((appointment) => (
                <Card key={appointment._id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div
                    className={`h-1 w-full ${appointment.status === "confirmed" ? "bg-green-500" : "bg-amber-500"}`}
                  />
                  <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        className={`h-12 w-12 ${appointment.status === "confirmed" ? "bg-green-100" : "bg-amber-100"}`}
                      >
                        <AvatarFallback
                          className={`${appointment.status === "confirmed" ? "text-green-700" : "text-amber-700"}`}
                        >
                          {getDoctorInitials(appointment.doctorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h4>
                        <p className="text-sm text-gray-600">{appointment.doctorId.specialization}</p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </CardHeader>

                  <CardContent className="p-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 font-medium">
                          {new Date(appointment.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 font-medium">{appointment.time}</span>
                      </div>

                      {appointment.symptoms && (
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 mt-1">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-700 font-medium">Symptoms: </span>
                            <span className="text-gray-600">{appointment.symptoms}</span>
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 mt-1">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-700 font-medium">Notes: </span>
                            <span className="text-gray-600">{appointment.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAppointment(appointment)}
                      className="text-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>

                    {appointment.status !== "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRescheduleAppointment(appointment)}
                        className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Pagination */}
              {totalPagesUpcoming > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: totalPagesUpcoming }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPageUpcoming === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange("upcoming", page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Past Appointments Tab */}
        <TabsContent value="past" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by doctor or specialization..."
                value={searchTermPast}
                onChange={(e) => setSearchTermPast(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatusPast} onValueChange={setFilterStatusPast}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPastAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No past appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPastAppointments.map((appointment) => (
                <Card key={appointment._id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className={`h-1 w-full ${appointment.status === "completed" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        className={`h-12 w-12 ${appointment.status === "completed" ? "bg-blue-100" : "bg-gray-100"}`}
                      >
                        <AvatarFallback
                          className={`${appointment.status === "completed" ? "text-blue-700" : "text-gray-700"}`}
                        >
                          {getDoctorInitials(appointment.doctorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h4>
                        <p className="text-sm text-gray-600">{appointment.doctorId.specialization}</p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </CardHeader>

                  <CardContent className="p-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 font-medium">
                          {new Date(appointment.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 font-medium">{appointment.time}</span>
                      </div>

                      {appointment.symptoms && (
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 mt-1">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-700 font-medium">Symptoms: </span>
                            <span className="text-gray-600">{appointment.symptoms}</span>
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 mt-1">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-700 font-medium">Notes: </span>
                            <span className="text-gray-600">{appointment.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {appointment.feedback ? (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-blue-800">Your Feedback</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < appointment.feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-blue-700">{appointment.feedback.comment}</p>
                      </div>
                    ) : (
                      appointment.status === "completed" && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenFeedbackModal(appointment)}
                            className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 w-full"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Leave Feedback
                          </Button>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPagesPast > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: totalPagesPast }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPagePast === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange("past", page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={rescheduleData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={rescheduleData.time}
                onValueChange={(value) => setRescheduleData({ ...rescheduleData, time: value })}
                disabled={isLoadingTimes || availableTimes.length === 0}
              >
                <SelectTrigger id="time">
                  <SelectValue
                    placeholder={
                      isLoadingTimes ? "Loading..." : availableTimes.length === 0 ? "No available times" : "Select time"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingTimes &&
                    availableTimes.length > 0 &&
                    availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReschedule} disabled={isLoadingTimes || !rescheduleData.time}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment Details</DialogTitle>
          </DialogHeader>
          {modalError ? (
            <div className="text-center py-4">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-base mb-4">{modalError}</p>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    value={editData.symptoms}
                    onChange={(e) => handleEditDataChange("symptoms", e.target.value)}
                    placeholder="Describe your symptoms..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editData.notes}
                    onChange={(e) => handleEditDataChange("notes", e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitEdit}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleFeedbackDataChange("rating", star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= feedbackData.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={feedbackData.comment}
                onChange={(e) => handleFeedbackDataChange("comment", e.target.value)}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AppointmentManagement
