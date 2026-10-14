import React from 'react';
import { TaskAttachment } from '../types';
import { X, Download, FileText, Image as ImageIcon, Calendar, HardDrive } from 'lucide-react';

interface Props {
  attachment: TaskAttachment | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<Props> = ({ attachment, onClose }) => {
  if (!attachment) return null;

  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';
  const sizeMb = (attachment.size / (1024 * 1024)).toFixed(2);
  const sizeKb = Math.round(attachment.size / 1024);
  const sizeDisplay = attachment.size >= 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 overflow-hidden pr-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {attachment.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {sizeDisplay}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(attachment.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              title="Descargar archivo a tu dispositivo"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950 flex items-center justify-center">
          {isImage ? (
            <div className="max-w-full max-h-[70vh] flex items-center justify-center">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[65vh] flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
              <iframe
                src={`${attachment.dataUrl}#toolbar=1`}
                title={attachment.name}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="text-center py-12 px-6 max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Documento de Tarea Escolar
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Este archivo ({attachment.name.split('.').pop()?.toUpperCase()}) está almacenado de forma segura en tu dispositivo para acceso con o sin internet.
              </p>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar y Abrir en Word / Office
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
