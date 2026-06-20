import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileImage, Loader2, Sparkles, CheckCircle2, Camera, FolderOpen } from "lucide-react";
import { motion } from "motion/react";

interface ImageImporterProps {
  onPhotoImported: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
}

export default function ImageImporter({ 
  onPhotoImported, 
  title = "Importação e Captura Alternativa", 
  subtitle = "Use a câmera nativa do celular ou escolha uma imagem da sua galeria de fotos para enviar." 
}: ImageImporterProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPEG, WEBP).");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para garantir alta performance e persistência sem exceder cota do IndexedDB
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Define o tamanho ideal máximo (1280x720) mantendo proporção ou forçando formato cinema
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (ctx) {
          // Preencher fundo com preto para imagens de proporções diferentes
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Desenhar imagem centralizada contida na zona de aspecto-video
          const imgAspect = img.width / img.height;
          const canvasAspect = targetWidth / targetHeight;
          let drawWidth = targetWidth;
          let drawHeight = targetHeight;
          let dx = 0;
          let dy = 0;

          if (imgAspect > canvasAspect) {
            drawHeight = targetWidth / imgAspect;
            dy = (targetHeight - drawHeight) / 2;
          } else {
            drawWidth = targetHeight * imgAspect;
            dx = (targetWidth - drawWidth) / 2;
          }

          ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
          
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onPhotoImported(compressedDataUrl);

          setSuccessMsg(true);
          setTimeout(() => setSuccessMsg(false), 2000);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        alert("Erro ao ler dados da imagem.");
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo selecionado.");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const triggerNativeCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 bg-[#0C0C0E]/40 border border-white/10 rounded-2xl">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Processando Imagem...</p>
        </div>
      ) : successMsg ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-emerald-400 bg-emerald-950/10 border border-emerald-900/20 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
          <p className="text-sm font-semibold uppercase font-mono tracking-wider">Foto salva na galeria!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Quick choices layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Button 1: Force native phone camera */}
            <button
              type="button"
              onClick={triggerNativeCamera}
              className="group flex items-center justify-center gap-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white p-4 rounded-2xl font-bold text-sm tracking-wide font-mono active:scale-98 transition duration-200 shadow-lg shadow-indigo-500/10 cursor-pointer border border-white/10 uppercase"
            >
              <Camera className="w-5 h-5 text-indigo-100 group-hover:scale-110 transition duration-300" />
              Tirar Foto no Celular
            </button>

            {/* Button 2: Choose from gallery */}
            <button
              type="button"
              onClick={triggerGallery}
              className="group flex items-center justify-center gap-3.5 bg-black/60 hover:bg-[#121217] text-indigo-300 p-4 rounded-2xl font-bold text-sm tracking-wide font-mono active:scale-98 transition duration-200 border border-white/10 cursor-pointer uppercase hover:text-indigo-200"
            >
              <FolderOpen className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition duration-300" />
              Escolher da Galeria
            </button>
          </div>

          {/* Fallback Drag & Drop surface area if they want to drag files on PC/iPad */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerGallery}
            className={`relative w-full rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
              isDragActive 
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                : "border-white/10 bg-[#0C0C0E]/40 hover:border-indigo-500/30 hover:bg-[#0C0C0E]/70 text-slate-300"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20" />
            <Upload className="w-6 h-6 text-slate-500 mb-2 group-hover:text-indigo-400 group-hover:scale-105 duration-300" />
            <div>
              <p className="font-bold text-white text-xs tracking-tight group-hover:text-indigo-400 transition-colors uppercase font-mono">
                {title}
              </p>
              <p className="text-slate-400 text-[10px] mt-1 max-w-sm mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>
            
            <div className="mt-3 flex items-center gap-1.5 px-3.5 py-0.5 bg-black/30 rounded-full border border-white/5 text-[9px] text-slate-500 font-mono tracking-wider uppercase">
              <FileImage className="w-3.5 h-3.5 text-indigo-500" />
              <span>JPG, PNG, WEBP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

