import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguagePreference } from "@/lib/hooks";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { Case, CaseHearing } from "@shared/schema";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { FileUp, File, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isPast, isToday } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";

export default function CaseWorkbook({ onTabChange = () => {} }) {
  const { language } = useLanguagePreference();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isEditCaseOpen, setIsEditCaseOpen] = useState(false);
  const [isAddHearingOpen, setIsAddHearingOpen] = useState(false);
  const [isViewHearingOpen, setIsViewHearingOpen] = useState(false);
  const [isDeleteCaseOpen, setIsDeleteCaseOpen] = useState(false);
  
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Case schema
  const caseSchema = z.object({
    title: z.string().min(1, { 
      message: language === "en" ? "Title is required" : "शीर्षक आवश्यक है" 
    }),
    titleHindi: z.string().optional(),
    caseNumber: z.string().optional().nullable(),
    court: z.string().optional().nullable(),
    clientName: z.string().optional().nullable(),
    clientPhone: z.string().optional().nullable(),
    clientEmail: z.string().optional().nullable(),
    status: z.string().default("active"),
    description: z.string().optional().nullable(),
    descriptionHindi: z.string().optional().nullable(),
    nextHearingDate: z.string().optional().nullable(),
    nextHearingTime: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    reminderSet: z.boolean().default(false),
    reminderDate: z.string().optional().nullable(),
    reminderTime: z.string().optional().nullable(),
    reminderNote: z.string().optional().nullable(),
  });
  
  // Hearing schema
  const hearingSchema = z.object({
    date: z.string().min(1, { 
      message: language === "en" ? "Date is required" : "तारीख आवश्यक है" 
    }),
    notes: z.string().optional().nullable(),
    outcome: z.string().optional().nullable(),
    nextSteps: z.string().optional().nullable(),
    attendees: z.string().optional().nullable(),
    evidencePresented: z.string().optional().nullable(),
    judgmentSummary: z.string().optional().nullable(),
  });
  
  // Form handling
  const addCaseForm = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      titleHindi: "",
      caseNumber: "",
      court: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      status: "active",
      description: "",
      descriptionHindi: "",
      nextHearingDate: "",
      nextHearingTime: "",
      notes: "",
      reminderSet: false,
      reminderDate: "",
      reminderTime: "",
      reminderNote: "",
    },
  });
  
  const editCaseForm = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      titleHindi: "",
      caseNumber: "",
      court: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      status: "active",
      description: "",
      descriptionHindi: "",
      nextHearingDate: "",
      nextHearingTime: "",
      notes: "",
      reminderSet: false,
      reminderDate: "",
      reminderTime: "",
      reminderNote: "",
    },
  });
  
  const addHearingForm = useForm({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      date: "",
      notes: "",
      outcome: "",
      nextSteps: "",
      attendees: "",
      evidencePresented: "",
      judgmentSummary: "",
    },
  });
  
  // Data fetching
  const { data: casesData, isLoading: casesLoading } = useQuery({ 
    queryKey: ["/api/cases", DEFAULT_USER_ID],
    queryFn: () => apiRequest.get(`/api/cases/${DEFAULT_USER_ID}`).then(res => res.data),
  });
  
  const { data: hearingsData, isLoading: hearingsLoading } = useQuery({ 
    queryKey: ["/api/hearings", selectedCaseId],
    queryFn: () => selectedCaseId 
      ? apiRequest.get(`/api/cases/${selectedCaseId}/hearings`).then(res => res.data)
      : Promise.resolve([]),
    enabled: !!selectedCaseId,
  });
  
  const { data: selectedHearing } = useQuery({ 
    queryKey: ["/api/hearing", selectedHearingId],
    queryFn: () => selectedHearingId 
      ? apiRequest.get(`/api/hearings/${selectedHearingId}`).then(res => res.data)
      : Promise.resolve(null),
    enabled: !!selectedHearingId,
  });
  
  // Mutations
  const createCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Ensure we're sending all required fields properly
        const caseData = { 
          ...data, 
          userId: DEFAULT_USER_ID,
          status: data.status || 'active',
          reminderSet: !!data.reminderSet
        };
        
        // Convert empty strings to null
        Object.keys(caseData).forEach(key => {
          if (caseData[key] === "") {
            caseData[key] = null;
          }
        });
        
        const response = await apiRequest.post("/api/cases", caseData);
        return response.data;
      } catch (error) {
        console.error("Error creating case:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setIsAddCaseOpen(false);
      addCaseForm.reset();
      toast({
        title: language === "en" ? "Case Added" : "केस जोड़ा गया",
        description: language === "en" ? "Case has been added successfully" : "केस सफलतापूर्वक जोड़ा गया है",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to add case" : "केस जोड़ने में विफल",
      });
    },
  });
  
  const updateCaseMutation = useMutation({
    mutationFn: (data: any) => apiRequest.patch(`/api/cases/${selectedCaseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setIsEditCaseOpen(false);
      toast({
        title: language === "en" ? "Case Updated" : "केस अपडेट किया गया",
        description: language === "en" ? "Case has been updated successfully" : "केस सफलतापूर्वक अपडेट किया गया है",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to update case" : "केस अपडेट करने में विफल",
      });
    },
  });
  
  const deleteCaseMutation = useMutation({
    mutationFn: () => apiRequest.delete(`/api/cases/${selectedCaseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setSelectedCaseId(null);
      setSelectedCase(null);
      setIsDeleteCaseOpen(false);
      toast({
        title: language === "en" ? "Case Deleted" : "केस हटाया गया",
        description: language === "en" ? "Case has been deleted successfully" : "केस सफलतापूर्वक हटा दिया गया है",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to delete case" : "केस हटाने में विफल",
      });
    },
  });
  
  const createHearingMutation = useMutation({
    mutationFn: (data: any) => apiRequest.post("/api/hearings", { ...data, caseId: selectedCaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hearings", selectedCaseId] });
      setIsAddHearingOpen(false);
      addHearingForm.reset();
      toast({
        title: language === "en" ? "Hearing Added" : "सुनवाई जोड़ी गई",
        description: language === "en" ? "Hearing has been added successfully" : "सुनवाई सफलतापूर्वक जोड़ी गई है",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to add hearing" : "सुनवाई जोड़ने में विफल",
      });
    },
  });
  
  // Effects
  useEffect(() => {
    if (casesData && selectedCaseId) {
      const foundCase = casesData.find((c: Case) => c.id === selectedCaseId);
      setSelectedCase(foundCase || null);
      
      if (foundCase) {
        editCaseForm.reset({
          title: foundCase.title || "",
          titleHindi: foundCase.titleHindi || "",
          caseNumber: foundCase.caseNumber || "",
          court: foundCase.court || "",
          clientName: foundCase.clientName || "",
          clientPhone: foundCase.clientPhone || "",
          clientEmail: foundCase.clientEmail || "",
          status: foundCase.status || "active",
          description: foundCase.description || "",
          descriptionHindi: foundCase.descriptionHindi || "",
          nextHearingDate: foundCase.nextHearingDate 
            ? new Date(foundCase.nextHearingDate).toISOString().split('T')[0] 
            : "",
          nextHearingTime: foundCase.nextHearingTime || "",
          notes: foundCase.notes || "",
          reminderSet: foundCase.reminderSet || false,
          reminderDate: foundCase.reminderDate 
            ? new Date(foundCase.reminderDate).toISOString().split('T')[0]
            : "",
          reminderTime: foundCase.reminderTime || "",
          reminderNote: foundCase.reminderNote || "",
        });
      }
    }
  }, [casesData, selectedCaseId]);
  
  // Computed values
  const filteredCases = casesData?.filter((caseItem: Case) => {
    if (activeTab === "active") return caseItem.status !== "closed" && caseItem.status !== "dismissed";
    if (activeTab === "closed") return caseItem.status === "closed" || caseItem.status === "dismissed";
    return true; // 'all' tab
  });
  
  // Form submissions
  const onAddCaseSubmit = (data: any) => {
    createCaseMutation.mutate(data);
  };
  
  const onEditCaseSubmit = (data: any) => {
    updateCaseMutation.mutate(data);
  };
  
  const onAddHearingSubmit = (data: any) => {
    createHearingMutation.mutate(data);
  };
  
  // Event handlers
  const handleCardClick = (id: number) => {
    setSelectedCaseId(id);
  };
  
  // Format helpers
  const formatLocalDate = (date: string | Date | null) => {
    if (!date) return "";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return date.toString();
    }
  };
  
  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    let badgeClass = "px-2 py-1 text-xs rounded-full ";
    let statusText = status;
    
    switch (status) {
      case "active":
        badgeClass += "bg-green-100 text-green-800";
        statusText = language === "en" ? "Active" : "सक्रिय";
        break;
      case "pending":
        badgeClass += "bg-yellow-100 text-yellow-800";
        statusText = language === "en" ? "Pending" : "लंबित";
        break;
      case "closed":
        badgeClass += "bg-gray-100 text-gray-800";
        statusText = language === "en" ? "Closed" : "बंद";
        break;
      case "dismissed":
        badgeClass += "bg-red-100 text-red-800";
        statusText = language === "en" ? "Dismissed" : "खारिज";
        break;
      default:
        badgeClass += "bg-blue-100 text-blue-800";
    }
    
    return (
      <span className={badgeClass}>
        {statusText}
      </span>
    );
  };

  // Upcoming hearing indicator
  const UpcomingHearingIndicator = ({ date, time }: { date: string | Date | null, time?: string }) => {
    if (!date) return null;
    
    try {
      const hearingDate = new Date(date);
      const isUpcoming = !isPast(hearingDate) || isToday(hearingDate);
      
      if (isUpcoming) {
        return (
          <div className="flex items-center mt-2 text-xs text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {language === "en" ? "Upcoming: " : "आगामी: "} 
              {formatLocalDate(date)}
            </span>
            {time && (
              <span className="ml-1 bg-primary/10 text-primary px-1 rounded text-[10px]">
                {language === "en" ? "at" : "समय"} {time}
              </span>
            )}
          </div>
        );
      }
    } catch (e) {}
    
    return null;
  };

  // View a hearing
  const handleViewHearing = (hearingId: number) => {
    setSelectedHearingId(hearingId);
    setIsViewHearingOpen(true);
  };

  return (
    <div className="p-4 h-full overflow-auto max-h-[calc(100vh-64px)]">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onTabChange("home")}
          className="mr-2 p-2"
          size="icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="text-2xl font-bold">
          {language === "en" ? "Advocates Workbook" : "अधिवक्ता कार्यपुस्तिका"}
        </h2>
      </div>
      
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">
              {language === "en" ? "Active Cases" : "सक्रिय केस"}
            </TabsTrigger>
            <TabsTrigger value="closed">
              {language === "en" ? "Closed Cases" : "बंद केस"}
            </TabsTrigger>
            <TabsTrigger value="all">
              {language === "en" ? "All Cases" : "सभी केस"}
            </TabsTrigger>
          </TabsList>
          
          <Dialog open={isAddCaseOpen} onOpenChange={setIsAddCaseOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {language === "en" ? "Add New Case" : "नया केस जोड़ें"}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === "en" ? "Add New Case" : "नया केस जोड़ें"}
                </DialogTitle>
                <DialogDescription>
                  {language === "en" 
                    ? "Enter the details of the new case" 
                    : "नए केस का विवरण दर्ज करें"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...addCaseForm}>
                <form onSubmit={addCaseForm.handleSubmit(onAddCaseSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addCaseForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Case Title" : "केस का शीर्षक"}*
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={language === "en" ? "Enter case title" : "केस का शीर्षक दर्ज करें"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addCaseForm.control}
                      name="titleHindi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Case Title (Hindi)" : "केस का शीर्षक (हिंदी में)"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={language === "en" ? "Enter case title in Hindi" : "हिंदी में केस का शीर्षक दर्ज करें"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addCaseForm.control}
                      name="caseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Case Number" : "केस नंबर"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={language === "en" ? "Enter case number" : "केस नंबर दर्ज करें"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addCaseForm.control}
                      name="court"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Court" : "न्यायालय"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={language === "en" ? "Enter court name" : "न्यायालय का नाम दर्ज करें"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addCaseForm.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Client Name" : "ग्राहक का नाम"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={language === "en" ? "Enter client name" : "ग्राहक का नाम दर्ज करें"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addCaseForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "en" ? "Status" : "स्थिति"}
                          </FormLabel>
                          <Select 
                            defaultValue={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === "en" ? "Select status" : "स्थिति चुनें"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">
                                {language === "en" ? "Active" : "सक्रिय"}
                              </SelectItem>
                              <SelectItem value="pending">
                                {language === "en" ? "Pending" : "लंबित"}
                              </SelectItem>
                              <SelectItem value="closed">
                                {language === "en" ? "Closed" : "बंद"}
                              </SelectItem>
                              <SelectItem value="dismissed">
                                {language === "en" ? "Dismissed" : "खारिज"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={addCaseForm.control}
                          name="nextHearingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Next Hearing Date" : "अगली सुनवाई की तारीख"}
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addCaseForm.control}
                          name="nextHearingTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Hearing Time" : "सुनवाई का समय"}
                              </FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={addCaseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "en" ? "Case Description" : "केस का विवरण"}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={language === "en" ? "Enter case details" : "केस का विवरण दर्ज करें"} 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addCaseForm.control}
                    name="reminderSet"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {language === "en" ? "Set Reminder" : "रिमाइंडर सेट करें"}
                          </FormLabel>
                          <FormDescription>
                            {language === "en" 
                              ? "Get notified about important dates for this case" 
                              : "इस केस की महत्वपूर्ण तारीखों के बारे में सूचित रहें"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {addCaseForm.watch("reminderSet") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={addCaseForm.control}
                          name="reminderDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Reminder Date" : "रिमाइंडर की तारीख"}
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addCaseForm.control}
                          name="reminderTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Reminder Time" : "रिमाइंडर का समय"}
                              </FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={addCaseForm.control}
                        name="reminderNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "en" ? "Reminder Note" : "रिमाइंडर नोट"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={language === "en" ? "Note for the reminder" : "रिमाइंडर के लिए नोट"} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createCaseMutation.isPending}>
                      {createCaseMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {language === "en" ? "Saving..." : "सहेज रहा है..."}
                        </span>
                      ) : (
                        <span>{language === "en" ? "Save Case" : "केस सहेजें"}</span>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases?.length ? (
              filteredCases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedCaseId === caseItem.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCardClick(caseItem.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {language === "en" ? caseItem.title : caseItem.titleHindi || caseItem.title}
                        </CardTitle>
                        {caseItem.caseNumber && (
                          <CardDescription>
                            {language === "en" ? "Case No: " : "केस नंबर: "}
                            {caseItem.caseNumber}
                          </CardDescription>
                        )}
                      </div>
                      <StatusBadge status={caseItem.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {caseItem.clientName && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Client: " : "ग्राहक: "}</span>
                        {caseItem.clientName}
                      </div>
                    )}
                    {caseItem.court && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Court: " : "न्यायालय: "}</span>
                        {caseItem.court}
                      </div>
                    )}
                    <UpcomingHearingIndicator 
                      date={caseItem.nextHearingDate}
                      time={caseItem.nextHearingTime}
                    />
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-gray-500">
                    {formatLocalDate(caseItem.createdAt)}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600">
                  {language === "en" 
                    ? "No cases found. Click 'Add New Case' to create one." 
                    : "कोई केस नहीं मिला। एक बनाने के लिए 'नया केस जोड़ें' पर क्लिक करें।"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="closed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases?.length ? (
              filteredCases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedCaseId === caseItem.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCardClick(caseItem.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {language === "en" ? caseItem.title : caseItem.titleHindi || caseItem.title}
                        </CardTitle>
                        {caseItem.caseNumber && (
                          <CardDescription>
                            {language === "en" ? "Case No: " : "केस नंबर: "}
                            {caseItem.caseNumber}
                          </CardDescription>
                        )}
                      </div>
                      <StatusBadge status={caseItem.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {caseItem.clientName && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Client: " : "ग्राहक: "}</span>
                        {caseItem.clientName}
                      </div>
                    )}
                    {caseItem.court && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Court: " : "न्यायालय: "}</span>
                        {caseItem.court}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-gray-500">
                    {formatLocalDate(caseItem.createdAt)}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600">
                  {language === "en" 
                    ? "No closed cases yet." 
                    : "अभी तक कोई बंद केस नहीं है।"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases?.length ? (
              filteredCases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedCaseId === caseItem.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCardClick(caseItem.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {language === "en" ? caseItem.title : caseItem.titleHindi || caseItem.title}
                        </CardTitle>
                        {caseItem.caseNumber && (
                          <CardDescription>
                            {language === "en" ? "Case No: " : "केस नंबर: "}
                            {caseItem.caseNumber}
                          </CardDescription>
                        )}
                      </div>
                      <StatusBadge status={caseItem.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {caseItem.clientName && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Client: " : "ग्राहक: "}</span>
                        {caseItem.clientName}
                      </div>
                    )}
                    {caseItem.court && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">{language === "en" ? "Court: " : "न्यायालय: "}</span>
                        {caseItem.court}
                      </div>
                    )}
                    <UpcomingHearingIndicator 
                      date={caseItem.nextHearingDate}
                      time={caseItem.nextHearingTime}
                    />
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-gray-500">
                    {formatLocalDate(caseItem.createdAt)}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600">
                  {language === "en" 
                    ? "No cases found. Click 'Add New Case' to create one." 
                    : "कोई केस नहीं मिला। एक बनाने के लिए 'नया केस जोड़ें' पर क्लिक करें।"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Case Details Panel */}
      {selectedCaseId && selectedCase && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {language === "en" ? "Case Details" : "केस का विवरण"}
            </h3>
            <div className="flex space-x-2">
              <Dialog open={isEditCaseOpen} onOpenChange={setIsEditCaseOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {language === "en" ? "Edit" : "संपादित करें"}
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {language === "en" ? "Edit Case" : "केस संपादित करें"}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "en" 
                        ? "Update case details" 
                        : "केस का विवरण अपडेट करें"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...editCaseForm}>
                    <form onSubmit={editCaseForm.handleSubmit(onEditCaseSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editCaseForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Case Title" : "केस का शीर्षक"}*
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editCaseForm.control}
                          name="titleHindi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Case Title (Hindi)" : "केस का शीर्षक (हिंदी में)"}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editCaseForm.control}
                          name="caseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Case Number" : "केस नंबर"}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editCaseForm.control}
                          name="court"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Court" : "न्यायालय"}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editCaseForm.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Client Name" : "ग्राहक का नाम"}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editCaseForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === "en" ? "Status" : "स्थिति"}
                              </FormLabel>
                              <Select 
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">
                                    {language === "en" ? "Active" : "सक्रिय"}
                                  </SelectItem>
                                  <SelectItem value="pending">
                                    {language === "en" ? "Pending" : "लंबित"}
                                  </SelectItem>
                                  <SelectItem value="closed">
                                    {language === "en" ? "Closed" : "बंद"}
                                  </SelectItem>
                                  <SelectItem value="dismissed">
                                    {language === "en" ? "Dismissed" : "खारिज"}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="col-span-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editCaseForm.control}
                              name="nextHearingDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === "en" ? "Next Hearing Date" : "अगली सुनवाई की तारीख"}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editCaseForm.control}
                              name="nextHearingTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === "en" ? "Hearing Time" : "सुनवाई का समय"}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={editCaseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "en" ? "Case Description" : "केस का विवरण"}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editCaseForm.control}
                        name="reminderSet"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {language === "en" ? "Set Reminder" : "रिमाइंडर सेट करें"}
                              </FormLabel>
                              <FormDescription>
                                {language === "en" 
                                  ? "Get notified about important dates for this case" 
                                  : "इस केस की महत्वपूर्ण तारीखों के बारे में सूचित रहें"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {editCaseForm.watch("reminderSet") && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editCaseForm.control}
                              name="reminderDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === "en" ? "Reminder Date" : "रिमाइंडर की तारीख"}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editCaseForm.control}
                              name="reminderTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === "en" ? "Reminder Time" : "रिमाइंडर का समय"}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={editCaseForm.control}
                            name="reminderNote"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === "en" ? "Reminder Note" : "रिमाइंडर नोट"}
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsEditCaseOpen(false)}>
                          {language === "en" ? "Cancel" : "रद्द करें"}
                        </Button>
                        <Button type="submit" disabled={updateCaseMutation.isPending}>
                          {updateCaseMutation.isPending ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {language === "en" ? "Saving..." : "सहेज रहा है..."}
                            </span>
                          ) : (
                            <span>{language === "en" ? "Save Changes" : "परिवर्तन सहेजें"}</span>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <AlertDialog open={isDeleteCaseOpen} onOpenChange={setIsDeleteCaseOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {language === "en" ? "Delete" : "हटाएं"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === "en" ? "Delete Case" : "केस हटाएं"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === "en" 
                        ? "Are you sure you want to delete this case? This action cannot be undone." 
                        : "क्या आप वाकई इस केस को हटाना चाहते हैं? यह क्रिया वापस नहीं की जा सकती है।"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === "en" ? "Cancel" : "रद्द करें"}
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteCaseMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {language === "en" ? "Delete" : "हटाएं"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "en" ? selectedCase.title : selectedCase.titleHindi || selectedCase.title}
                  </CardTitle>
                  <div className="flex items-center mt-2">
                    <StatusBadge status={selectedCase.status} />
                    {selectedCase.caseNumber && (
                      <span className="ml-3 text-sm text-gray-500">
                        {language === "en" ? "Case No: " : "केस नंबर: "}
                        {selectedCase.caseNumber}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCase.court && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">{language === "en" ? "Court" : "न्यायालय"}</h4>
                        <p className="text-sm">{selectedCase.court}</p>
                      </div>
                    )}
                    
                    {selectedCase.clientName && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">{language === "en" ? "Client" : "ग्राहक"}</h4>
                        <p className="text-sm">{selectedCase.clientName}</p>
                        {(selectedCase.clientPhone || selectedCase.clientEmail) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {selectedCase.clientPhone && (
                              <div>{selectedCase.clientPhone}</div>
                            )}
                            {selectedCase.clientEmail && (
                              <div>{selectedCase.clientEmail}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedCase.nextHearingDate && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          {language === "en" ? "Next Hearing" : "अगली सुनवाई"}
                        </h4>
                        <p className="text-sm">
                          {formatLocalDate(selectedCase.nextHearingDate)}
                          {selectedCase.nextHearingTime && (
                            <span className="ml-2 bg-primary/10 text-primary px-1 rounded text-xs">
                              {selectedCase.nextHearingTime}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {selectedCase.reminderSet && selectedCase.reminderDate && (
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {language === "en" ? "Reminder Set" : "रिमाइंडर सेट"}
                        </h4>
                        <p className="text-sm">
                          {formatLocalDate(selectedCase.reminderDate)}
                          {selectedCase.reminderTime && (
                            <span className="ml-2 bg-amber-50 text-amber-600 px-1 rounded text-xs">
                              {selectedCase.reminderTime}
                            </span>
                          )}
                        </p>
                        {selectedCase.reminderNote && (
                          <p className="text-xs mt-1 text-gray-600">
                            {selectedCase.reminderNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedCase.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{language === "en" ? "Description" : "विवरण"}</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{selectedCase.description}</p>
                    </div>
                  )}
                  
                  {selectedCase.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{language === "en" ? "Notes" : "नोट्स"}</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{selectedCase.notes}</p>
                    </div>
                  )}
                  
                  {/* Documents Section */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">{language === "en" ? "Documents" : "दस्तावेज़"}</h4>
                      <DocumentUploadButton caseId={selectedCase.id} />
                    </div>
                    
                    {selectedCase.documents && selectedCase.documents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedCase.documents.map((doc: string, index: number) => (
                          <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md text-sm">
                            <File className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="flex-1 truncate">{doc.split('_').slice(1).join('_')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {language === "en" ? "No documents uploaded" : "कोई दस्तावेज़ अपलोड नहीं किया गया"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">
                    {language === "en" ? "Hearings" : "सुनवाई"}
                  </h3>
                  <Dialog open={isAddHearingOpen} onOpenChange={setIsAddHearingOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {language === "en" ? "Add Hearing" : "सुनवाई जोड़ें"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {language === "en" ? "Add Hearing Record" : "सुनवाई का रिकॉर्ड जोड़ें"}
                        </DialogTitle>
                        <DialogDescription>
                          {language === "en" 
                            ? "Enter details about the hearing" 
                            : "सुनवाई के बारे में विवरण दर्ज करें"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...addHearingForm}>
                        <form onSubmit={addHearingForm.handleSubmit(onAddHearingSubmit)} className="space-y-6">
                          <FormField
                            control={addHearingForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === "en" ? "Hearing Date" : "सुनवाई की तारीख"}*
                                </FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addHearingForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === "en" ? "Notes" : "नोट्स"}
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={language === "en" ? "Enter notes about the hearing" : "सुनवाई के बारे में नोट्स दर्ज करें"} 
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addHearingForm.control}
                            name="outcome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === "en" ? "Outcome" : "परिणाम"}
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={language === "en" ? "Enter hearing outcome" : "सुनवाई का परिणाम दर्ज करें"} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit" disabled={createHearingMutation.isPending}>
                              {createHearingMutation.isPending ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {language === "en" ? "Saving..." : "सहेज रहा है..."}
                                </span>
                              ) : (
                                <span>{language === "en" ? "Save Hearing" : "सुनवाई सहेजें"}</span>
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {hearingsLoading ? (
                  <div className="text-center p-8">
                    <svg className="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : hearingsData?.length ? (
                  <div className="space-y-3">
                    {hearingsData.map((hearing: CaseHearing) => (
                      <Card key={hearing.id} className="hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">
                              {formatLocalDate(hearing.date)}
                            </CardTitle>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewHearing(hearing.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm">
                          {hearing.outcome && (
                            <div className="text-sm">
                              <span className="font-medium">{language === "en" ? "Outcome: " : "परिणाम: "}</span>
                              {hearing.outcome}
                            </div>
                          )}
                          {hearing.notes && (
                            <div className="mt-2 text-xs text-gray-600 line-clamp-2">
                              {hearing.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">
                      {language === "en" 
                        ? "No hearings recorded yet. Add one to track the progress of the case." 
                        : "अभी तक कोई सुनवाई दर्ज नहीं की गई है। केस की प्रगति को ट्रैक करने के लिए एक जोड़ें।"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === "en" ? "Details" : "विवरण"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {language === "en" ? "Created on" : "बनाया गया"}
                    </p>
                    <p>{formatLocalDate(selectedCase.createdAt)}</p>
                  </div>
                  {selectedCase.updatedAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {language === "en" ? "Last updated" : "आखिरी अपडेट"}
                      </p>
                      <p>{formatLocalDate(selectedCase.updatedAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {selectedCase.reminderSet && selectedCase.reminderDate && (
                <Card className="mt-4 bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center text-amber-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {language === "en" ? "Reminder" : "रिमाइंडर"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-amber-800">
                        {formatLocalDate(selectedCase.reminderDate)}
                      </span>
                      {selectedCase.reminderTime && (
                        <span className="ml-2 bg-amber-100 text-amber-700 px-1 rounded text-xs">
                          {selectedCase.reminderTime}
                        </span>
                      )}
                    </div>
                    {selectedCase.reminderNote && (
                      <p className="text-amber-700 pl-5">
                        {selectedCase.reminderNote}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* View Hearing Dialog */}
      <Dialog open={isViewHearingOpen} onOpenChange={setIsViewHearingOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Hearing Details" : "सुनवाई का विवरण"}
            </DialogTitle>
            <DialogDescription>
              {selectedHearing && formatLocalDate(selectedHearing.date)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedHearing && (
            <div className="space-y-4">
              {selectedHearing.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Notes" : "नोट्स"}</h4>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{selectedHearing.notes}</p>
                </div>
              )}
              
              {selectedHearing.outcome && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Outcome" : "परिणाम"}</h4>
                  <p className="text-sm">{selectedHearing.outcome}</p>
                </div>
              )}
              
              {selectedHearing.nextSteps && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Next Steps" : "अगले कदम"}</h4>
                  <p className="text-sm">{selectedHearing.nextSteps}</p>
                </div>
              )}
              
              {selectedHearing.attendees && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Attendees" : "उपस्थित"}</h4>
                  <p className="text-sm">{selectedHearing.attendees}</p>
                </div>
              )}
              
              {selectedHearing.evidencePresented && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Evidence Presented" : "प्रस्तुत साक्ष्य"}</h4>
                  <p className="text-sm">{selectedHearing.evidencePresented}</p>
                </div>
              )}
              
              {selectedHearing.judgmentSummary && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "en" ? "Judgment Summary" : "निर्णय सारांश"}</h4>
                  <p className="text-sm">{selectedHearing.judgmentSummary}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewHearingOpen(false)}>
              {language === "en" ? "Close" : "बंद करें"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Document Upload Component
interface DocumentUploadButtonProps {
  caseId: number;
}

function DocumentUploadButton({ caseId }: DocumentUploadButtonProps) {
  const { language } = useLanguagePreference();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('document', file);
    
    setIsUploading(true);
    
    try {
      await apiRequest.upload(`/api/cases/${caseId}/documents`, formData);
      
      // Invalidate the case details query to refresh the document list
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      
      toast({
        title: language === "en" ? "Document Uploaded" : "दस्तावेज़ अपलोड किया गया",
        description: language === "en" 
          ? "Document has been attached to the case" 
          : "दस्तावेज़ केस से जुड़ गया है",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: language === "en" ? "Upload Failed" : "अपलोड विफल",
        description: language === "en" 
          ? "Failed to upload document" 
          : "दस्तावेज़ अपलोड करने में विफल",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload}
        className="hidden" 
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleButtonClick}
        disabled={isUploading}
        className="text-xs"
      >
        {isUploading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {language === "en" ? "Uploading..." : "अपलोड हो रहा है..."}
          </span>
        ) : (
          <span className="flex items-center">
            <FileUp className="h-3 w-3 mr-1" />
            {language === "en" ? "Upload" : "अपलोड करें"}
          </span>
        )}
      </Button>
    </div>
  );
}