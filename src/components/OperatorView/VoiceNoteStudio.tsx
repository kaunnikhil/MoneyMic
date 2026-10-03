import React, { useState, useRef } from 'react';
import { OperatorAudioAsset, UserInteraction } from '../../types/simulation';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Send,
  Languages,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface VoiceNoteStudioProps {
  audioAssets: OperatorAudioAsset[];
  pendingInteractions: UserInteraction[];
  onUploadAudio: (asset: OperatorAudioAsset, dataBase64?: string) => void;
  onRespondUser: (
    interactionId: string,
    responseType: 'VOICE_NOTE',
    payload: any,
    audioAssetId: string,
    audioTranscript: string
  ) => void;
  isProcessing: boolean;
}

export const VoiceNoteStudio: React.FC<VoiceNoteStudioProps> = ({
  audioAssets,
  pendingInteractions,
  onUploadAudio,
  onRespondUser,
  isProcessing,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(audioAssets[0]?.id || '');
  const [languageCode, setLanguageCode] = useState('en-IN');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Check if Gemini agent independently requested voice clarification
  const pendingAudioInteraction = pendingInteractions.find(
    (i) => !i.resolved && i.requiresAudio
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const newAssetId = `audio_rec_${Date.now()}`;
          const newAsset: OperatorAudioAsset = {
            id: newAssetId,
            fileName: 'live_user_mic_response.webm',
            mimeType: 'audio/webm',
            durationSeconds: 4.5,
            uploadedAt: new Date().toISOString(),
            languageCode,
            storedTranscript: '',
            url: url,
            dataBase64: base64data,
          };

          onUploadAudio(newAsset, base64data);
          setSelectedAssetId(newAssetId);
        };
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setMicError(null);
    } catch (err: any) {
      setMicError(`Could not access microphone: ${err.message || 'Permission denied'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newAssetId = `audio_file_${Date.now()}`;
      const newAsset: OperatorAudioAsset = {
        id: newAssetId,
        fileName: file.name,
        mimeType: file.type || 'audio/mp3',
        durationSeconds: 5.0,
        uploadedAt: new Date().toISOString(),
        languageCode,
        storedTranscript: '',
        url: `/api/audio/${newAssetId}`,
        dataBase64: base64,
      };

      onUploadAudio(newAsset, base64);
      setSelectedAssetId(newAssetId);
    };
  };

  const handlePlayAudio = (url: string, id: string) => {
    if (activePlayingId === id) {
      audioPlayerRef.current?.pause();
      setActivePlayingId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
        setActivePlayingId(id);
      }
    }
  };

  const selectedAsset = audioAssets.find((a) => a.id === selectedAssetId) || audioAssets[0];

  const handleDispatchToAgent = () => {
    if (!pendingAudioInteraction || !selectedAsset) return;
    // Operator supplies the audio asset ID only. Gemini calls gnani_transcribe to parse it.
    onRespondUser(
      pendingAudioInteraction.id,
      'VOICE_NOTE',
      { audioAssetId: selectedAsset.id },
      selectedAsset.id,
      ''
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <audio
        ref={audioPlayerRef}
        onEnded={() => setActivePlayingId(null)}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Voice Note Feed & Gnani STT Bridge
            </h2>
            <p className="text-xs text-slate-400">
              Supply voice note audio ONLY after agent decides clarification is required • Transcribed via Gnani STT
            </p>
          </div>
        </div>

        {/* Pending Agent Request Notification */}
        {pendingAudioInteraction ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-xs font-mono font-bold text-purple-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Waiting for Voice Note</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono">
            Agent is passive (No active voice prompt)
          </span>
        )}
      </div>
      {micError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{micError}</span>
          <button
            onClick={() => setMicError(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Audio Capture / Upload */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
              1. Record or Upload Audio
            </span>
            <div className="flex items-center space-x-1.5">
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-800 text-[11px]"
              >
                <option value="en-IN">en-IN (Indian English)</option>
                <option value="hi-IN">hi-IN (Hindi)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record Voice Note</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-3.5 py-2 bg-rose-700 animate-pulse text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Recording</span>
              </button>
            )}

            <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center space-x-1.5 border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Audio (.mp3/.wav/.webm)</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-bold uppercase text-[10px] block">
              Operator Constraint:
            </span>
            <p>
              The operator cannot type a semantic interpretation. Gemini independently receives the audio asset and invokes the Gnani REST STT API without paraphrasing.
            </p>
          </div>
        </div>

        {/* Right: Audio Asset Store & Dispatch */}
        <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                2. Audio Assets in Event Store
              </span>
              <span className="font-mono text-[11px] text-purple-400">
                {audioAssets.length} Stored
              </span>
            </div>

            {audioAssets.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                No audio assets registered. Record or upload an audio file above.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mb-3">
                {audioAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isPlaying = activePlayingId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/60 shadow-sm'
                          : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(asset.url, asset.id);
                          }}
                          className={`p-1.5 rounded-md ${
                            isPlaying
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div className="truncate">
                          <div className="font-mono font-bold text-slate-200 text-[11px] truncate">
                            {asset.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            ID: {asset.id} • {asset.languageCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispatch button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Selected: {selectedAsset?.id || 'None'}
            </span>
            <button
              onClick={handleDispatchToAgent}
              disabled={isProcessing || !pendingAudioInteraction || !selectedAsset}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Supply Audio to MoneyMic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
