import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera, Flashlight, RotateCcw, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WorkCompletionForm from "@/components/work-completion-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [selectedWorkCard, setSelectedWorkCard] = useState<any>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const { data: recentSessions } = useQuery({
    queryKey: ["/api/work-sessions/recent"],
    queryFn: async () => {
      const response = await fetch("/api/work-sessions/recent?limit=5");
      if (!response.ok) throw new Error("Failed to fetch recent sessions");
      return response.json();
    },
  });

  const lookupWorkCard = useMutation({
    mutationFn: async (input: string) => {
      // Try lookup by QR code first, then by card ID
      let response = await fetch(`/api/work-cards/qr/${encodeURIComponent(input)}`);
      if (!response.ok) {
        response = await fetch(`/api/work-cards?cardId=${encodeURIComponent(input)}`);
        if (!response.ok) throw new Error("Work card not found");
        const cards = await response.json();
        if (cards.length === 0) throw new Error("Work card not found");
        return cards[0];
      }
      return response.json();
    },
    onSuccess: (workCard) => {
      setSelectedWorkCard(workCard);
      setShowCompletionForm(true);
      setIsScanning(false);
      toast({
        title: "Work card found",
        description: `Loaded ${workCard.title} for completion.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Work card not found",
        description: error.message || "Please check the QR code or card ID and try again.",
        variant: "destructive",
      });
    },
  });

  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer back camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Simulate QR scan after 3 seconds for demo purposes
      setTimeout(() => {
        // Use one of the seeded work card QR codes for demo
        lookupWorkCard.mutate("QR-WC-002-EFGH5678");
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      lookupWorkCard.mutate(manualEntry.trim());
      setManualEntry("");
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return time.toLocaleDateString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "completed":
        return "✅";
      case "started":
        return "▶️";
      case "in-progress":
        return "⏳";
      default:
        return "📝";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[hsl(var(--text-dark))] mb-4">QR Code Scanner</h2>
        <p className="text-gray-600">Scan work card QR codes to log completion or update status</p>
      </div>

      {/* Scanner Interface */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gray-900 relative" style={{ height: "400px" }}>
          {isScanning ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Ready to scan</p>
                <p className="text-sm opacity-75">Tap the button below to start scanning</p>
              </div>
            </div>
          )}
          
          {/* Scanner Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[hsl(var(--secondary))] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[hsl(var(--secondary))] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[hsl(var(--secondary))] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[hsl(var(--secondary))] rounded-br-lg"></div>
                  
                  {/* Scanning Line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-[hsl(var(--secondary))] opacity-75 scan-line"></div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-white text-sm font-medium">Position QR code within the frame</p>
                  <p className="text-gray-300 text-xs mt-1">Hold steady for automatic scanning</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="p-3 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30"
              >
                <Flashlight className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                disabled={lookupWorkCard.isPending}
                className={`px-6 py-3 rounded-lg font-medium transition-colors scan-animation ${
                  isScanning 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white"
                }`}
              >
                <Camera className="w-5 h-5 mr-2" />
                {isScanning ? "Stop Scanning" : "Start Scanning"}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-3 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Manual Entry */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">Can't scan? Enter work card ID manually</p>
          <div className="flex space-x-3">
            <Input
              placeholder="Enter Work Card ID (e.g., WC-001)"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
              className="flex-1"
            />
            <Button 
              onClick={handleManualSubmit}
              disabled={!manualEntry.trim() || lookupWorkCard.isPending}
            >
              {lookupWorkCard.isPending ? "Looking up..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center text-white">
                      {getActionIcon(session.action)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[hsl(var(--text-dark))]">
                        {session.workCard?.title || "Unknown Work Card"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(session.timestamp)} by {session.employee?.name || "Unknown Employee"}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${
                    session.action === "completed" ? "status-completed" :
                    session.action === "started" ? "status-assigned" : "status-in-progress"
                  }`}>
                    {session.action.charAt(0).toUpperCase() + session.action.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No recent scans</div>
              <p className="text-sm text-gray-400">Scanned work cards will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Completion Form Modal */}
      {selectedWorkCard && (
        <WorkCompletionForm
          workCard={selectedWorkCard}
          isOpen={showCompletionForm}
          onClose={() => {
            setShowCompletionForm(false);
            setSelectedWorkCard(null);
          }}
        />
      )}
    </div>
  );
}
