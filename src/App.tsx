import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Mail, 
  Settings, 
  Trash2, 
  Send, 
  Check, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Info, 
  CheckCircle2, 
  Image as ImageIcon, 
  Eye, 
  ArrowLeft,
  Settings2,
  X,
  MailCheck,
  Smartphone,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { savePhoto, getAllPhotos, deletePhoto, CapturedPhoto } from "./db";
import ImageImporter from "./components/ImageImporter";

interface SmtpSettings {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
}

export default function App() {
  // Navigation: "camera" | "gallery" | "settings"
  const [activeTab, setActiveTab] = useState<"camera" | "gallery" | "settings">("camera");

  // Photos State
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Email Config States
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: ""
  });

  // Sending Email States
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Alert State for successful camera captures
  const [captureMessage, setCaptureMessage] = useState(false);

  // Load photos and settings from LocalStorage/IndexedDB on Mount
  useEffect(() => {
    loadPhotos();

    // Load registered emails
    const storedEmails = localStorage.getItem("registered_emails");
    if (storedEmails) {
      try {
        const parsed = JSON.parse(storedEmails);
        setRegisteredEmails(parsed);
        if (parsed.length > 0) {
          setSelectedRecipient(parsed[0]);
        }
      } catch (e) {
        console.error("Error parsing stored emails:", e);
      }
    } else {
      // Add default recipient email if provided in metadata (fallback user's email)
      const defaultEmail = "jubabarkika1@gmail.com";
      setRegisteredEmails([defaultEmail]);
      setSelectedRecipient(defaultEmail);
      localStorage.setItem("registered_emails", JSON.stringify([defaultEmail]));
    }

    // Load SMTP settings
    const storedSmtp = localStorage.getItem("smtp_settings");
    if (storedSmtp) {
      try {
        setSmtpSettings(JSON.parse(storedSmtp));
      } catch (e) {
        console.error("Error parsing stored smtp settings:", e);
      }
    }
  }, []);

  // Monitor camera stream based on page visibility and active tab
  useEffect(() => {
    if (activeTab === "camera" && !isSimulating) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, facingMode, isSimulating]);

  const loadPhotos = async () => {
    try {
      const list = await getAllPhotos();
      setPhotos(list);
    } catch (err) {
      console.error("Error loading photos:", err);
    }
  };

  // Camera Actions
  const startCamera = async (currentFacingMode: "user" | "environment") => {
    setIsSimulating(false);
    setCameraLoading(true);
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Seu navegador ou iframe impede o acesso direto à câmera por motivos de segurança. Por favor, use a Importação Manual abaixo para enviar fotos."
      );
      setCameraLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      // Fallback if environment (back camera) fails and we are probably on desktop
      if (currentFacingMode === "environment") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false
          });
          setFacingMode("user");
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
          setCameraLoading(false);
          return;
        } catch (innerErr) {
          console.error("Fallback camera failure:", innerErr);
        }
      }
      setCameraError(
        "Não foi possível acessar a câmera do celular. Por favor, certifique-se de conceder permissão de câmera ao navegador e que nenhum outro app a esteja utilizando."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
  };

  const capturePhoto = async () => {
    if (isSimulating) {
      // Direct instantaneous flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw a dark space high-contrast tech gradient
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, "#09080c");
        grad.addColorStop(0.5, "#0e111a");
        grad.addColorStop(1, "#1c1944");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Draw camera crosshairs and HUD in simulation mode
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(640, 360, 200, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
        ctx.beginPath();
        ctx.arc(640, 360, 280, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(640, 300);
        ctx.lineTo(640, 420);
        ctx.moveTo(580, 360);
        ctx.lineTo(700, 360);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(640, 360, 6, 0, Math.PI * 2);
        ctx.fill();

        // Render premium typography for the caption
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic bold 44px sans-serif";
        ctx.fillText("FOTOENVIO", 80, 600);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "24px monospace";
        ctx.fillText("SIMULATION-CAPTURE RAW // OK", 80, 640);

        // Date Info
        ctx.fillStyle = "#38bdf8";
        ctx.font = "22px monospace";
        ctx.fillText(new Date().toLocaleString("pt-BR"), 80, 90);

        // HUD elements
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.fillText("● REC DEV_MODE", 1000, 90);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.strokeRect(40, 40, 1200, 640);

        const dataUrl = canvas.toDataURL("image/png");

        const newPhoto: CapturedPhoto = {
          id: "photo_" + Date.now(),
          dataUrl,
          createdAt: Date.now(),
          sentTo: []
        };

        try {
          await savePhoto(newPhoto);
          await loadPhotos();
          
          setCaptureMessage(true);
          setTimeout(() => setCaptureMessage(false), 2500);
        } catch (err) {
          console.error("Failed to save simulated photo:", err);
        }
      }
      return;
    }

    if (!videoRef.current || !stream) return;

    // Direct instantaneous flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    
    // Create an offscreen canvas to render the video frame
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror image if using front-facing camera
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");

      const newPhoto: CapturedPhoto = {
        id: "photo_" + Date.now(),
        dataUrl,
        createdAt: Date.now(),
        sentTo: []
      };

      try {
        await savePhoto(newPhoto);
        await loadPhotos();
        
        // Show momentary floating capture toast success
        setCaptureMessage(true);
        setTimeout(() => setCaptureMessage(false), 2500);
      } catch (err) {
        console.error("Failed to save photo to IndexedDB gallery:", err);
      }
    }
  };

  const handleImportedPhoto = async (dataUrl: string) => {
    const newPhoto: CapturedPhoto = {
      id: "photo_" + Date.now(),
      dataUrl,
      createdAt: Date.now(),
      sentTo: []
    };

    try {
      await savePhoto(newPhoto);
      await loadPhotos();
      
      // Show momentary floating capture toast success
      setCaptureMessage(true);
      setTimeout(() => setCaptureMessage(false), 2500);
    } catch (err) {
      console.error("Failed to save imported photo to IndexedDB gallery:", err);
    }
  };

  // Recipient Email Management
  const addEmail = () => {
    const email = newEmailInput.trim();
    if (!email) return;
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Por favor, digite um e-mail válido.");
      return;
    }

    if (registeredEmails.includes(email)) {
      alert("Este e-mail já está cadastrado.");
      return;
    }

    const updated = [...registeredEmails, email];
    setRegisteredEmails(updated);
    localStorage.setItem("registered_emails", JSON.stringify(updated));
    setNewEmailInput("");
    if (!selectedRecipient) {
      setSelectedRecipient(email);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const updated = registeredEmails.filter(email => email !== emailToRemove);
    setRegisteredEmails(updated);
    localStorage.setItem("registered_emails", JSON.stringify(updated));
    if (selectedRecipient === emailToRemove) {
      setSelectedRecipient(updated[0] || "");
    }
  };

  // SMTP Configuration Settings Save
  const saveSmtpSettings = (updatedConfig: SmtpSettings) => {
    setSmtpSettings(updatedConfig);
    localStorage.setItem("smtp_settings", JSON.stringify(updatedConfig));
  };

  // Autofill SMTP servers helper
  const autofillSmtpConfig = (provider: string) => {
    let prefill: SmtpSettings = { ...smtpSettings };
    if (provider === "gmail") {
      prefill = {
        host: "smtp.gmail.com",
        port: "587",
        secure: false, // TLS
        user: smtpSettings.user || "",
        pass: smtpSettings.pass || ""
      };
    } else if (provider === "outlook") {
      prefill = {
        host: "smtp.office365.com",
        port: "587",
        secure: false, // TLS
        user: smtpSettings.user || "",
        pass: smtpSettings.pass || ""
      };
    } else if (provider === "mailtrap") {
      prefill = {
        host: "sandbox.smtp.mailtrap.io",
        port: "2525",
        secure: false,
        user: smtpSettings.user || "",
        pass: smtpSettings.pass || ""
      };
    }
    saveSmtpSettings(prefill);
  };

  // Send Photo via Email API
  const handleSendEmail = async () => {
    if (!selectedPhoto) return;
    if (!selectedRecipient) {
      setSendError("Por favor, cadastre e selecione um e-mail de destino.");
      return;
    }

    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);

    const formattedDate = new Date(selectedPhoto.createdAt).toLocaleDateString("pt-BR");
    const imageName = `captura_${selectedPhoto.id.replace("photo_", "")}.png`;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: selectedRecipient,
          image: selectedPhoto.dataUrl,
          imageName,
          smtpSettings: {
            host: smtpSettings.host || undefined,
            port: smtpSettings.port || undefined,
            secure: smtpSettings.secure,
            user: smtpSettings.user || undefined,
            pass: smtpSettings.pass || undefined
          }
        })
      });

      let result: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(`Resposta inesperada do servidor (${response.status}): ${errorText.substring(0, 120)}`);
      }

      if (!response.ok) {
        if (result.error === "SMTP_NOT_CONFIGURED") {
          throw new Error("SMTP_NOT_CONFIGURED");
        } else {
          throw new Error(result.message || "Falha no envio do e-mail.");
        }
      }

      // Success updating photo locally to track where it was sent
      const updatedPhoto = {
        ...selectedPhoto,
        sentTo: [...new Set([...selectedPhoto.sentTo, selectedRecipient])]
      };
      
      await savePhoto(updatedPhoto);
      setSelectedPhoto(updatedPhoto);
      // Refresh list
      await loadPhotos();

      setSendSuccess(`Foto enviada com sucesso para ${selectedRecipient}!`);
    } catch (err: any) {
      console.error("Error sending email:", err);
      if (err.message === "SMTP_NOT_CONFIGURED") {
        setSendError(
          "Configuração de e-mail SMTP ausente! Acesse a aba 'Configurar' para cadastrar seu servidor de e-mail de forma segura."
        );
      } else {
        setSendError(
          `Falha ao enviar e-mail: ${err.message || "Por favor, verifique suas credenciais SMTP e conexão."}`
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (confirm("Deseja realmente remover esta foto da sua galeria?")) {
      await deletePhoto(photoId);
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
      await loadPhotos();
    }
  };

  return (
    <div className="min-h-screen bg-[#080809] text-slate-200 font-sans flex flex-col justify-between overflow-x-hidden antialiased selection:bg-indigo-500 selection:text-white relative">
      
      {/* Decorative Immersive Background Ambient Light Flares */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 left-0 w-[450px] h-[450px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Dynamic Immersive Top Header */}
      <header className="relative z-10 bg-[#0C0C0E]/90 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-8 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl border border-white/5 relative overflow-hidden group">
            <span className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition duration-300" />
            <Camera className="w-5 h-5 relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tighter text-white">
              SNAP<span className="text-indigo-500">SEND</span>
            </h1>
          </div>
        </div>

        {/* Global Immersive Status & Settings Pill in Fixed Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 px-3 py-1.5 bg-black/40 rounded-full border border-white/5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">Pronto</span>
          </div>

          <button
            onClick={() => {
              setActiveTab("settings");
              setSelectedPhoto(null);
            }}
            title="Configurações"
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              activeTab === "settings"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-bold"
                : "bg-black/40 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Container Section */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-start gap-6">
        
        <AnimatePresence mode="wait">
          {/* CAMERA VIEWPORT TAB */}
          {activeTab === "camera" && (
            <motion.div
              key="camera-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col gap-6"
            >


              {cameraError ? (
                /* Fallback mode if camera permissions are blocked */
                <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                  <div className="p-5 bg-red-950/15 rounded-3xl border border-red-900/20 text-slate-300 shadow-xl flex flex-col sm:flex-row gap-5 items-center">
                    <div className="p-4 bg-red-950/30 rounded-2xl border border-red-800/40 text-red-400 shrink-0">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="font-bold text-red-400 text-sm tracking-tight">Acesso à Câmera Negado</h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        Como este aplicativo está rodando dentro de uma pré-visualização (iframe) ou o navegador não tem permissão para usar o hardware, a câmera real foi desativada pelo sistema.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5 justify-center sm:justify-start">
                        <button
                          onClick={() => startCamera(facingMode)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all border border-white/5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Re-inicializar Sensor
                        </button>
                        <button
                          onClick={() => {
                            setCameraError(null);
                            setIsSimulating(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all border border-indigo-500/30 cursor-pointer shadow-lg shadow-indigo-600/20"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Ativar Simulador de Câmera
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fully functional premium drag-and-drop file upload code */}
                  <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Modo de Importação Manual</span>
                    </div>
                    <ImageImporter 
                      onPhotoImported={handleImportedPhoto}
                      title="Importar Foto da Galeria do Celular"
                      subtitle="Toque ou arraste e solte arquivos de imagem para salvar direto na galeria e disparar e-mails" 
                    />
                  </div>
                </div>
              ) : (
                /* Normal Interactive Camera Viewfinder */
                <div className="flex flex-col gap-6">
                  <div className="relative aspect-[9/16] md:aspect-video w-full max-w-2xl mx-auto rounded-[32px] md:rounded-[40px] overflow-hidden bg-black border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center group">
                    {/* Visual Lens Outer Mask Frame */}
                    <div className="absolute inset-0 border-[16px] md:border-[20px] border-black/40 pointer-events-none z-10" />

                    {/* Camera crosshair lines and central target circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full pointer-events-none z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full pointer-events-none z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500/30 pointer-events-none z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-indigo-500/30 pointer-events-none z-10" />

                    {/* Top-left HUD Overlays */}
                    <div className="absolute top-8 left-8 flex flex-col gap-0.5 z-10 font-mono text-[9px] pointer-events-none tracking-wider uppercase text-slate-400">
                      <span className="text-indigo-400 font-bold">ISO 400</span>
                      <span className="opacity-60">F/2.8</span>
                      <span className="opacity-40">AUTO WB</span>
                    </div>

                    {/* Top-right HUD Overlays */}
                    <div className="absolute top-8 right-8 flex flex-col items-end gap-0.5 z-10 font-mono text-[9px] pointer-events-none tracking-wider uppercase text-slate-400">
                      <span className="text-red-500 font-bold animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        REC RAW
                      </span>
                      <span className="opacity-60">1080P 60FPS</span>
                    </div>

                    {/* Left HUD camera mode indicator (Moved to Top Left HUD group area) */}
                    <div className="absolute top-24 left-8 z-15 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[9px] font-mono border border-white/5 flex items-center gap-1.5 text-slate-300">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isSimulating ? "SIMULATION MODE" : (facingMode === "user" ? "Selfie Mode" : "Traseira RAW")}</span>
                    </div>

                    {/* Bottom-left Battery & Rec Status Overlay (Lifted up slightly) */}
                    <div className="absolute bottom-32 left-8 z-10 flex items-center gap-2.5 font-mono text-[9px] text-slate-400 pointer-events-none tracking-widest dropdown-shadow">
                      <div className="w-10 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-emerald-500"></div>
                      </div>
                      <span className="opacity-75 uppercase">BATTERY OK</span>
                    </div>

                    {/* Bottom-right Camera active Mode (Lifted up slightly) */}
                    <div className="absolute bottom-32 right-8 z-10 pointer-events-none">
                      <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-md text-[9px] font-mono border border-white/5 text-indigo-400 uppercase tracking-widest">
                        {facingMode === "user" ? "Front-Lens" : "Wide-Lens"}
                      </span>
                    </div>

                    {/* Camera Flash Animation Layer */}
                    <AnimatePresence>
                      {isFlashing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-white z-50 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {cameraLoading && (
                      <div className="absolute inset-0 bg-[#080809]/95 z-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Ajustando Lente...</p>
                      </div>
                    )}

                    {isSimulating ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-black to-[#050508] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                        <div className="flex flex-col items-center gap-4 z-10">
                          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
                            <Sparkles className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider font-mono">Simulador de Lente Ativo</h4>
                            <p className="text-slate-400 text-[11px] max-w-sm mt-1 leading-relaxed">
                              Simulador ativo para capturas em desktops ou ambientes sem câmera integrada.
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-[9px] uppercase tracking-widest rounded-full border border-indigo-500/30">
                            Pronto para Disparar
                          </span>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                      />
                    )}
                    
                    {/* Floating active manual camera controls */}
                    <div className="absolute top-6 right-6 z-15 flex gap-2">
                      <button
                        onClick={toggleCameraFacingMode}
                        title="Inverter Sensor de Imagem"
                        className="p-2.5 bg-slate-950/80 backdrop-blur-md hover:bg-indigo-600 hover:text-white rounded-full text-slate-200 transition-all border border-white/5 flex items-center justify-center cursor-pointer shadow-lg outline-none active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Floating Shutter Trigger in the Bottom-Center */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5">
                      <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md p-1.5 border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        <button
                          onClick={capturePhoto}
                          disabled={cameraLoading || (!stream && !isSimulating)}
                          className="w-full h-full rounded-full bg-white flex items-center justify-center ring-4 ring-indigo-500/30 hover:scale-105 active:scale-95 disabled:bg-slate-800 disabled:ring-0 disabled:opacity-40 disabled:scale-100 cursor-pointer transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.4)] outline-none overflow-hidden"
                        >
                          <div className="w-6 h-6 rounded-full border-2 border-slate-950/20"></div>
                        </button>
                      </div>
                      <span className="text-[7px] font-bold text-white/40 tracking-[0.2em] font-mono uppercase">
                        TAP TO CAPTURE
                      </span>
                    </div>
                  </div>

                  {/* Manual Importer Expansion option for fine-tuning */}
                  <div className="w-full max-w-2xl mx-auto border-t border-white/5 pt-5">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowImporter(!showImporter)}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-2 transition px-5 py-2.5 border border-white/5 bg-[#0C0C0E]/60 hover:bg-[#0C0C0E]/90 rounded-full shadow-lg"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        {showImporter ? "Ocultar Importador Manual" : "Importar Foto da Galeria Local (Alt)"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showImporter && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-4"
                        >
                          <ImageImporter onPhotoImported={handleImportedPhoto} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Floating Camera Capture Success Toast message */}
              <AnimatePresence>
                {captureMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-semibold border border-white/20 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                    <span>Foto capturada e salva na galeria!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Peek horizontal selector */}
              <div className="mt-4 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between px-1 mb-4">
                  <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-2 font-mono">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Recém-capturadas
                  </h3>
                  <button 
                    onClick={() => setActiveTab("gallery")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold flex items-center gap-1 transition"
                  >
                    Ver todas as {photos.length} fotos &rarr;
                  </button>
                </div>

                {photos.length === 0 ? (
                  <div className="p-8 text-center bg-[#0C0C0E] rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <ImageIcon className="w-8 h-8 opacity-20 shrink-0 text-slate-400" />
                    <p className="text-xs font-mono">NENHUMA FOTO DISPONÍVEL</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {photos.slice(0, 4).map((photo) => (
                      <div 
                        key={photo.id}
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setActiveTab("gallery");
                        }}
                        className="aspect-video relative rounded-2xl overflow-hidden border border-white/15 bg-black group cursor-pointer hover:border-indigo-500/60 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all duration-300"
                      >
                        <img 
                          src={photo.dataUrl} 
                          alt="Recent captured capture" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-550"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-2">
                          <span className="text-[8px] font-mono text-slate-300">EXHIBIT</span>
                        </div>
                        {photo.sentTo.length > 0 && (
                          <div className="absolute top-1.5 right-1.5 p-1 bg-emerald-500 rounded-full text-white" title="Já enviado">
                            <MailCheck className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* GALLERY VIEWPORT TAB */}
          {activeTab === "gallery" && (
            <motion.div
              key="gallery-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col gap-6"
            >
              {selectedPhoto ? (
                // Focused full picture and send control panel
                <div className="flex flex-col gap-6">
                  {/* Photo details Header control line */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setSendSuccess(null);
                        setSendError(null);
                      }}
                      className="px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition border border-white/10 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar para Galeria
                    </button>

                    <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-950/20 border border-indigo-900/30 px-3 py-1 rounded-full">
                      {new Date(selectedPhoto.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Image Viewer Element */}
                    <div className="flex flex-col gap-3">
                      <div className="aspect-video max-w-full rounded-[32px] overflow-hidden bg-black border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.5)] relative group">
                        <img
                          src={selectedPhoto.dataUrl}
                          alt="Focused premium captured target"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/5">
                          1280 × 720 px
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <button
                          onClick={() => handleDeletePhoto(selectedPhoto.id)}
                          className="px-3.5 py-2 bg-red-950/30 text-red-400 hover:bg-red-950/50 border border-red-900/30 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Remover Foto
                        </button>
                        
                        {selectedPhoto.sentTo.length > 0 && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5 font-mono">
                            <Check className="w-3.5 h-3.5" /> ENVIADO PARA: {selectedPhoto.sentTo.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* High-end Immersive Send Drawer */}
                    <div className="bg-[#0C0C0E] rounded-3xl border border-white/5 p-5 shadow-2xl flex flex-col gap-5">
                      <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                        <Mail className="w-5 h-5 text-[#6366f1]" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Disparar Arquivo</h3>
                      </div>

                      <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                          Endereço de Destino:
                        </label>

                        {registeredEmails.length === 0 ? (
                          <div className="p-5 rounded-2xl bg-black border border-white/5 text-center flex flex-col gap-3.5">
                            <p className="text-xs text-slate-500 font-mono">NENHUM E-MAIL CADASTRADO</p>
                            <button
                              onClick={() => setActiveTab("settings")}
                              className="mx-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full transition shadow-lg shadow-indigo-500/20 cursor-pointer"
                            >
                              Configurar Destinatário
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <select
                              value={selectedRecipient}
                              onChange={(e) => setSelectedRecipient(e.target.value)}
                              className="w-full bg-black text-slate-100 border border-white/5 p-3 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                            >
                              {registeredEmails.map((email) => (
                                <option key={email} value={email}>
                                  {email}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 font-mono">
                              *Você pode adicionar múltiplos destinatários na aba <b>Configurar</b>.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Warning box if SMTP attributes are empty */}
                      {(!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) && (
                        <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-2xl text-amber-300 text-xs flex gap-3.5">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <span className="font-bold block mb-0.5 uppercase text-amber-400 text-[10px] tracking-wider font-mono">Modo de Teste / SMTP não ajustado</span>
                            Configure seu servidor SMTP nas configurações para enviar arquivos reais a partir de seu email pessoal.
                          </div>
                        </div>
                      )}

                      {/* Success / error alert feedback panels */}
                      {sendSuccess && (
                        <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/35 text-emerald-300 rounded-2xl text-xs flex gap-2.5 items-center">
                          <Check className="w-5 h-5 shrink-0 text-emerald-400 animate-bounce" />
                          <span>{sendSuccess}</span>
                        </div>
                      )}

                      {sendError && (
                        <div className="p-3.5 bg-red-950/20 border border-red-900/40 text-red-300 rounded-2xl text-xs flex flex-col gap-1.5">
                          <div className="flex gap-2.5 items-start">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <span>{sendError}</span>
                          </div>
                          {sendError.includes("SMTP") && (
                            <button
                              onClick={() => {
                                setSendError(null);
                                setActiveTab("settings");
                              }}
                              className="text-[10px] text-indigo-400 hover:underline font-bold text-left pl-7"
                            >
                              Acessar Painel de Configurações &rarr;
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleSendEmail}
                        disabled={isSending || registeredEmails.length === 0}
                        className="w-full bg-indigo-600 disabled:bg-[#1a1a20] disabled:text-slate-600 hover:bg-indigo-500 p-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wide font-mono"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            TRANSMITINDO ARQUIVO...
                          </>
                        ) : (
                          <>
                            <span>SEND TO EMAIL</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                // Full beautiful grid interface
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-end pb-2 border-b border-white/5">
                    <div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                        Galeria Local
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Armazenamento em cache local: <b className="text-slate-200">{photos.length} fotos salvas</b>
                      </p>
                    </div>
                    {photos.length > 0 && (
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">
                        Selecione para processar
                      </span>
                    )}
                  </div>

                  {photos.length === 0 ? (
                    <div className="py-20 text-center bg-[#0C0C0E] rounded-[32px] border border-white/5 flex flex-col items-center justify-center gap-4 text-slate-400 max-w-lg mx-auto w-full mt-6 shadow-2xl">
                      <div className="p-4 bg-black rounded-2xl border border-white/5 text-slate-500">
                        <ImageIcon className="w-10 h-10 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white tracking-tight">Câmera sem Registros</h4>
                        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed font-mono">
                          Dispare a câmera integrada acima para salvar arquivos instantaneamente nesta galeria.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("camera")}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full transition shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> Ativar Câmera
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {photos.map((photo) => {
                        const dateFormatted = new Date(photo.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        });

                        return (
                          <div
                            key={photo.id}
                            className="group relative rounded-2xl overflow-hidden bg-[#0C0C0E] border border-white/5 hover:border-white/20 hover:shadow-2xl transition-all duration-350 cursor-pointer flex flex-col"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            {/* Graphic image frame container */}
                            <div className="aspect-video w-full overflow-hidden relative">
                              <img
                                src={photo.dataUrl}
                                alt="Gallery file frame"
                                className="w-full h-full object-cover group-hover:scale-103 transition-all duration-350"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center">
                                <span className="px-3 py-1.5 bg-black/80 rounded-full text-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-white/5 backdrop-blur-sm">
                                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Visualizar
                                </span>
                              </div>
                            </div>

                            {/* Caption element with status */}
                            <div className="p-3.5 bg-[#0C0C0E]/90 flex justify-between items-center border-t border-white/5">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-slate-400">{dateFormatted}</span>
                                {photo.sentTo.length > 0 ? (
                                  <span className="text-[8px] font-bold font-mono tracking-widest text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 self-start uppercase">
                                    Enviada
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold font-mono tracking-widest text-[#6366f1] bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/30 self-start uppercase">
                                    Pendente
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Avoid triggering full screen selector
                                  handleDeletePhoto(photo.id);
                                }}
                                title="Excluir"
                                className="p-1.5 hover:bg-white/5 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* SETTINGS AND STMP MANAGEMENT CONFIGURATION PANEL */}
          {activeTab === "settings" && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col gap-6"
            >
              {/* Recipient card setup */}
              <div className="bg-[#0C0C0E] rounded-3xl border border-white/5 p-5 shadow-2xl flex flex-col gap-5">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono text-xs text-indigo-400">
                    <Mail className="w-4.5 h-4.5" />
                    Destinatários de E-mail
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cadastre os endereços de destino para que apareçam na lista de envio.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addEmail();
                    }}
                    className="flex-1 bg-black border border-white/5 p-3 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-slate-200 pl-4 font-mono"
                  />
                  <button
                    onClick={addEmail}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition duration-300 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar
                  </button>
                </div>

                {/* Listing emails */}
                <div className="flex flex-col gap-2.5 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Contas de Destino ({registeredEmails.length}):
                  </span>
                  
                  {registeredEmails.length === 0 ? (
                    <p className="text-xs text-slate-500 italic font-mono">Nenhum e-mail adicionado. Digite no campo acima para começar.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {registeredEmails.map((email) => (
                        <div
                          key={email}
                          className="px-3.5 py-1.5 bg-black border border-white/5 rounded-full text-xs flex items-center gap-2.5 text-slate-200 hover:border-white/10 transition-all font-mono"
                        >
                          <span>{email}</span>
                          <button
                            onClick={() => removeEmail(email)}
                            className="text-slate-500 hover:text-red-400 transition"
                            title="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SMTP configuration panel */}
              <div className="bg-[#0C0C0E] rounded-3xl border border-white/5 p-5 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono text-xs text-indigo-400">
                    <Settings2 className="w-4.5 h-4.5" />
                    Servidor SMTP
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Insira as configurações de SMTP para que o próprio aplicativo execute o envio de forma integrada.
                  </p>
                </div>

                {/* AutoFill Quick Links */}
                <div className="flex flex-col gap-2.5 bg-black p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    Pré-Configuração Rápida:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => autofillSmtpConfig("gmail")}
                      className="px-3 py-1 bg-[#0C0C0E] hover:bg-indigo-950/20 hover:text-indigo-400 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg border border-white/5 transition"
                    >
                      Gmail (Google)
                    </button>
                    <button
                      onClick={() => autofillSmtpConfig("outlook")}
                      className="px-3 py-1 bg-[#0C0C0E] hover:bg-indigo-950/20 hover:text-indigo-400 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg border border-white/5 transition"
                    >
                      Outlook / Hotmail
                    </button>
                    <button
                      onClick={() => autofillSmtpConfig("mailtrap")}
                      className="px-3 py-1 bg-[#0C0C0E] hover:bg-indigo-950/20 hover:text-indigo-400 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg border border-white/5 transition"
                    >
                      Mailtrap Sandbox
                    </button>
                  </div>
                </div>

                {/* Input components */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Host SMTP</label>
                    <input
                      type="text"
                      placeholder="smtp.seudominio.com"
                      value={smtpSettings.host}
                      onChange={(e) => saveSmtpSettings({ ...smtpSettings, host: e.target.value })}
                      className="bg-black border border-white/5 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Porta SMTP</label>
                    <input
                      type="text"
                      placeholder="587 ou 465"
                      value={smtpSettings.port}
                      onChange={(e) => saveSmtpSettings({ ...smtpSettings, port: e.target.value })}
                      className="bg-black border border-white/5 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Usuário SMTP / Remetente</label>
                    <input
                      type="text"
                      placeholder="usuario@dominio.com"
                      value={smtpSettings.user}
                      onChange={(e) => saveSmtpSettings({ ...smtpSettings, user: e.target.value })}
                      className="bg-black border border-white/5 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Senha SMTP / Token de App</label>
                    <input
                      type="password"
                      placeholder="Senha ou código do aplicativo"
                      value={smtpSettings.pass}
                      onChange={(e) => saveSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                      className="bg-black border border-white/5 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {/* Connection constraints SSL/TLS */}
                <div className="flex items-start gap-2.5 mt-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={smtpSettings.secure}
                    onChange={(e) => saveSmtpSettings({ ...smtpSettings, secure: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 bg-black border-white/10 rounded focus:ring-indigo-500 focus:ring-2 mt-0.5"
                  />
                  <label htmlFor="smtpSecure" className="text-xs font-semibold text-slate-300 select-none cursor-pointer leading-tight">
                    Conexão exige SSL direto (Marcar apenas para porta 465. Porta 587/TLS padrão não exige esta opção ativa)
                  </label>
                </div>

                {/* Instruction container help */}
                <div className="mt-2 text-xs bg-black p-4.5 rounded-2xl border border-white/5 flex flex-col gap-3">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[10px]">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Como autenticar com segurança no Gmail?
                  </span>
                  <div className="text-slate-400 flex flex-col gap-1.5 leading-relaxed">
                    <p>
                      1. Acesse o painel do seu <b>Google Account</b> &gt; <b>Segurança</b> &gt; <b>Verificação em duas etapas</b>.
                    </p>
                    <p>
                      2. Na parte inferior do painel, selecione o menu <b>Senhas de app</b>.
                    </p>
                    <p>
                      3. Adicione um novo aplicativo temporário chamado <span className="font-mono text-indigo-300">"FotoEnvio"</span>. O Google criará uma senha de 16 caracteres.
                    </p>
                    <p>
                      4. Insira este código de 16 caracteres sem espaços no campo <b>Senha SMTP</b> localizado no formulário de preenchimento acima.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar matching Immersive layout perfectly */}
      <footer className="relative z-10 bg-[#0C0C0E]/95 backdrop-blur-xl border-t border-white/5 py-3 px-4 md:px-6 sticky bottom-0 shadow-3xl">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          
          <button
            onClick={() => {
              setActiveTab("camera");
              setSelectedPhoto(null);
            }}
            className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer outline-none relative duration-300 ${
              activeTab === "camera" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "camera" && (
              <motion.span
                layoutId="active-pill"
                className="absolute inset-0 bg-indigo-500/10 border border-white/10 rounded-2xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Camera className="w-4 h-4 shrink-0" />
            <span>Câmera</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("gallery");
            }}
            className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer outline-none relative duration-300 ${
              activeTab === "gallery" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "gallery" && (
              <motion.span
                layoutId="active-pill"
                className="absolute inset-0 bg-indigo-500/10 border border-white/10 rounded-2xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative">
              <ImageIcon className="w-4 h-4 shrink-0" />
              {photos.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-indigo-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full scale-90 shadow-md">
                  {photos.length}
                </span>
              )}
            </div>
            <span>Galeria</span>
          </button>

        </div>
      </footer>

    </div>
  );
}
