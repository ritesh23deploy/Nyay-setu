import { useState } from 'react';
import { useLanguagePreference } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

export default function CaseAnalysis() {
  const { language } = useLanguagePreference();
  const [caseText, setCaseText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaseText(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeCase = async () => {
    if (!caseText.trim()) {
      setError(language === 'en' 
        ? 'Please enter case details to analyze'
        : 'कृपया विश्लेषण के लिए केस विवरण दर्ज करें');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/analyze-case', {
        caseText,
        language
      });
      
      const responseData = await response.json();
      if (responseData && responseData.analysis) {
        setAnalysis(responseData.analysis);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error analyzing case:', err);
      setError(language === 'en' 
        ? 'Failed to analyze case. Please try again.'
        : 'केस विश्लेषण में विफल रहा। कृपया पुनः प्रयास करें।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError(language === 'en' 
        ? 'Please select a document to analyze'
        : 'कृपया विश्लेषण के लिए एक दस्तावेज़ चुनें');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('language', language);
      
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Document analysis failed');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError(language === 'en' 
        ? 'Failed to analyze document. Please try again.'
        : 'दस्तावेज़ विश्लेषण में विफल रहा। कृपया पुनः प्रयास करें।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setCaseText('');
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold mb-4">
          {language === 'en' ? 'AI Case Analysis' : 'एआई केस विश्लेषण'}
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">
                {language === 'en' ? 'Enter Case Details' : 'केस विवरण दर्ज करें'}
              </h3>
              <Textarea
                value={caseText}
                onChange={handleTextChange}
                placeholder={language === 'en' 
                  ? 'Enter case details, facts, or legal questions here...'
                  : 'यहां केस विवरण, तथ्य या कानूनी प्रश्न दर्ज करें...'}
                className="min-h-[150px]"
              />
              <div className="mt-2 flex justify-end">
                <Button 
                  onClick={analyzeCase}
                  disabled={isAnalyzing || !caseText.trim()}
                >
                  {isAnalyzing 
                    ? (language === 'en' ? 'Analyzing...' : 'विश्लेषण हो रहा है...') 
                    : (language === 'en' ? 'Analyze Case' : 'केस विश्लेषण करें')}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-2">
                {language === 'en' ? 'Upload Document' : 'दस्तावेज़ अपलोड करें'}
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                {language === 'en' 
                  ? 'Upload a legal document, court order, or case file (PDF or Image).'
                  : 'कानूनी दस्तावेज़, न्यायालय आदेश, या केस फ़ाइल अपलोड करें (पीडीएफ या इमेज)।'}
              </p>
              
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <span className="material-icons text-primary text-4xl mb-2">description</span>
                    <p className="text-neutral-700 font-medium">{file.name}</p>
                    <p className="text-neutral-500 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFile(null)}
                    >
                      {language === 'en' ? 'Remove File' : 'फ़ाइल हटाएं'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="material-icons text-neutral-400 text-4xl mb-2">upload_file</span>
                    <p className="text-neutral-600">
                      {language === 'en' 
                        ? 'Drag & drop a file here, or click to browse'
                        : 'फ़ाइल को यहां खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें'}
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={analyzeDocument}
                  disabled={isAnalyzing || !file}
                >
                  {isAnalyzing 
                    ? (language === 'en' ? 'Analyzing...' : 'विश्लेषण हो रहा है...') 
                    : (language === 'en' ? 'Analyze Document' : 'दस्तावेज़ विश्लेषण करें')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-700">
              <span className="material-icons mr-2">error_outline</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">
                {language === 'en' ? 'Analysis Results' : 'विश्लेषण परिणाम'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
              >
                <span className="material-icons text-sm mr-1">refresh</span>
                <span>{language === 'en' ? 'New Analysis' : 'नया विश्लेषण'}</span>
              </Button>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg border prose max-w-none">
              {analysis.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}