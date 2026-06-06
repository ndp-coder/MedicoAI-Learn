import { useState, useRef, useCallback } from "react";
import { Loader2, Upload, CheckCircle2, XCircle, Trophy, RotateCcw, Eye, Camera, RotateCw, Crop, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { toast } from "sonner";
import ReactCrop, { type Crop as CropType, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface DiagramQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface DiagramQuizData {
  description: string;
  structuresIdentified: string[];
  questions: DiagramQuestion[];
}

function getCroppedCanvas(image: HTMLImageElement, crop: PixelCrop, rotation: number): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const radian = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radian));
  const cos = Math.abs(Math.cos(radian));

  // Full image rotated dimensions
  const fullW = image.naturalWidth * cos + image.naturalHeight * sin;
  const fullH = image.naturalWidth * sin + image.naturalHeight * cos;

  // If no crop area set, use full image
  const hasCrop = crop.width > 0 && crop.height > 0;

  if (!hasCrop && rotation === 0) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  if (!hasCrop) {
    canvas.width = fullW;
    canvas.height = fullH;
    ctx.translate(fullW / 2, fullH / 2);
    ctx.rotate(radian);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  // Scale factors from displayed to natural
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  // For cropping with rotation, first render the rotated full image to a temp canvas
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCanvas.width = fullW;
  tempCanvas.height = fullH;
  tempCtx.translate(fullW / 2, fullH / 2);
  tempCtx.rotate(radian);
  tempCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  // Now extract the crop region
  const cropScaleX = fullW / image.width;
  const cropScaleY = fullH / image.height;
  ctx.drawImage(
    tempCanvas,
    crop.x * cropScaleX, crop.y * cropScaleY,
    crop.width * cropScaleX, crop.height * cropScaleY,
    0, 0,
    canvas.width, canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

const DiagramQuiz = () => {
  const [loading, setLoading] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [quizData, setQuizData] = useState<DiagramQuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image too large (max 10MB)"); return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setRawImage(dataUrl);
      setEditing(true);
      setRotation(0);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setQuizData(null);
      setAnswers({});
      setSubmitted(false);
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleConfirmEdit = useCallback(async () => {
    if (!imgRef.current || !rawImage) return;

    const finalDataUrl = getCroppedCanvas(
      imgRef.current,
      completedCrop || { x: 0, y: 0, width: 0, height: 0, unit: "px" },
      rotation
    );

    setImagePreview(finalDataUrl);
    setEditing(false);
    setLoading(true);

    try {
      const base64 = finalDataUrl.split(",")[1];
      const { data, error } = await supabase.functions.invoke("generate-diagram-quiz", {
        body: { imageBase64: base64, imageType: "image/jpeg" },
      });
      if (error) throw error;
      setQuizData(data);
      logActivity("quiz");
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze diagram");
    } finally {
      setLoading(false);
    }
  }, [rawImage, completedCrop, rotation]);

  const handleSubmit = () => {
    if (!quizData || Object.keys(answers).length < quizData.questions.length) {
      toast.error("Answer all questions first");
      return;
    }
    setSubmitted(true);
  };

  const score = submitted && quizData
    ? quizData.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  const handleReset = () => {
    setImagePreview(null);
    setRawImage(null);
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);
    setEditing(false);
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div>
        <h2 className="text-lg font-bold">🔬 Diagram Quiz</h2>
        <p className="text-xs text-muted-foreground">Upload a dental diagram — AI generates labeling questions</p>
      </div>

      {/* Upload / Camera */}
      {!rawImage && !imagePreview && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-secondary transition-colors" onClick={() => fileRef.current?.click()}>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-semibold">Upload a diagram</p>
              <p className="text-xs text-muted-foreground mt-1">Tooth cross-section, skull, TMJ, muscles...</p>
              <p className="text-[10px] text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
            </div>
            <div className="text-center text-xs text-muted-foreground">or</div>
            <Button variant="outline" className="w-full" onClick={() => cameraRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" /> Take a Photo
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </CardContent>
        </Card>
      )}

      {/* Crop & Rotate Editor */}
      {editing && rawImage && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Crop className="w-4 h-4 text-secondary" /> Edit Image
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Drag to crop • Rotate if needed</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center max-h-[400px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  src={rawImage}
                  alt="Edit"
                  className="max-h-[380px] object-contain"
                  style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate} className="flex-1">
                <RotateCw className="w-4 h-4 mr-1" /> Rotate 90°
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCrop(undefined); setCompletedCrop(undefined); }} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-1" /> Reset Crop
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmEdit} className="flex-1 gradient-teal text-secondary-foreground font-semibold">
                <Check className="w-4 h-4 mr-1" /> Analyze Diagram
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final image + quiz */}
      {imagePreview && !editing && (
        <>
          <Card className="border-none shadow-sm overflow-hidden">
            <img src={imagePreview} alt="Uploaded diagram" className="w-full max-h-[300px] object-contain bg-muted" />
          </Card>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
              <p className="text-sm text-muted-foreground">Analyzing diagram...</p>
            </div>
          )}

          {quizData && (
            <div className="space-y-4 animate-slide-up">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-secondary" /> AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>{quizData.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quizData.structuresIdentified.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {submitted && (
                <Card className="border-none shadow-sm animate-scale-in">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-bold">Score: {score}/{quizData.questions.length}</p>
                      <p className="text-xs text-muted-foreground">{score === quizData.questions.length ? "Perfect! 🌟" : "Keep practicing! 💪"}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {quizData.questions.map((q, qi) => (
                <Card key={qi} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Q{qi + 1}. {q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <RadioGroup
                      value={answers[qi]?.toString()}
                      onValueChange={v => !submitted && setAnswers(prev => ({ ...prev, [qi]: parseInt(v) }))}
                      disabled={submitted}
                    >
                      {q.options.map((opt, oi) => {
                        const isCorrect = submitted && oi === q.correctIndex;
                        const isWrong = submitted && answers[qi] === oi && oi !== q.correctIndex;
                        return (
                          <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" : isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" : "border-border"}`}>
                            <RadioGroupItem value={oi.toString()} id={`dq${qi}-o${oi}`} />
                            <Label htmlFor={`dq${qi}-o${oi}`} className="text-xs cursor-pointer flex-1">{opt}</Label>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            {isWrong && <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        );
                      })}
                    </RadioGroup>
                    {submitted && <p className="text-[10px] text-muted-foreground px-2">💡 {q.explanation}</p>}
                  </CardContent>
                </Card>
              ))}

              {!submitted ? (
                <Button onClick={handleSubmit} className="w-full gradient-teal text-secondary-foreground font-semibold">
                  Check Answers
                </Button>
              ) : (
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Another Diagram
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {!rawImage && !imagePreview && (
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold">Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Upload clear, well-labeled diagrams for best results</li>
            <li>Works with tooth morphology, skull anatomy, TMJ, muscles</li>
            <li>Crop to focus on the relevant area for better analysis</li>
            <li>Rotate photos taken at an angle</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiagramQuiz;
