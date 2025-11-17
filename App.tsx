

import React, { useState, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
type Stage = 'tp' | 'yellow' | 'fc' | 'drop';

interface RoastingInput {
  temp: string;
  time: string; // MM:SS format
}

interface RoastingData {
  tp: RoastingInput;
  yellow: RoastingInput;
  fc: RoastingInput; // First Crack
  drop: RoastingInput;
}

interface RorResult {
  phase: string;
  duration: string; // Formatted as MM:SS
  ror: number;
  percentage: number;
}

// --- SVG ICONS ---
const ThermometerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V8a3 3 0 00-6 0v8a3 3 0 106 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0112 2a8.003 8.003 0 015.014 1.014C19.5 5 20 8 20 10c2 1 2.657 1.657 2.657 1.657a8 8 0 01-5.001 7z" />
    </svg>
);


// --- HELPER FUNCTIONS ---
const parseTimeToSeconds = (timeStr: string): number | null => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds) || seconds > 59) return null;
  return minutes * 60 + seconds;
};

const formatSecondsToTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const stageToKorean = (stage: Stage): string => {
    switch (stage) {
        case 'tp': return '터닝 포인트';
        case 'yellow': return '옐로우 구간';
        case 'fc': return '1차 크랙';
        case 'drop': return '배출';
        // Fix for: Property 'toUpperCase' does not exist on type 'never'.
        // The `default` case is unreachable because all members of the `Stage` union type are handled.
        // This causes TypeScript to infer the type of `stage` as `never`.
        // By casting `stage` to `string`, we satisfy the type checker while preserving the intended fallback behavior.
        default: return (stage as string).toUpperCase();
    }
};

// --- CHILD COMPONENTS ---

interface InputGroupProps {
    stage: Stage;
    label: string;
    data: RoastingInput;
    onChange: (stage: Stage, field: keyof RoastingInput, value: string) => void;
}

const InputGroup: React.FC<InputGroupProps> = ({ stage, label, data, onChange }) => (
    <div className="bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-3">{label}</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor={`${stage}-temp`} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">온도 (°C)</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <ThermometerIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="number"
                        id={`${stage}-temp`}
                        value={data.temp}
                        onChange={(e) => onChange(stage, 'temp', e.target.value)}
                        placeholder="예: 160"
                        className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    />
                </div>
            </div>
            <div>
                <label htmlFor={`${stage}-time`} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">시간 (MM:SS)</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        id={`${stage}-time`}
                        value={data.time}
                        onChange={(e) => onChange(stage, 'time', e.target.value)}
                        placeholder="예: 05:30"
                        className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    />
                </div>
            </div>
        </div>
    </div>
);

interface ResultsTableProps {
    results: RorResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => (
    <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-2 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">구간</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">ROR</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">소요시간</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">구간 비율 (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {results.map((result) => (
                                <tr key={result.phase}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-2 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{result.phase}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 font-mono font-semibold text-right">{result.ror.toFixed(2)}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 text-right">{result.duration}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 text-right">{result.percentage.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const YELLOW_TEMP_KEY = 'roastingRorApp_yellowTemp';
  const FC_TEMP_KEY = 'roastingRorApp_fcTemp';

  const getInitialState = (): RoastingData => {
    const savedYellowTemp = localStorage.getItem(YELLOW_TEMP_KEY);
    const savedFcTemp = localStorage.getItem(FC_TEMP_KEY);
    
    return {
      tp: { temp: '', time: '' },
      yellow: { temp: savedYellowTemp || '', time: '' },
      fc: { temp: savedFcTemp || '', time: '' },
      drop: { temp: '', time: '' },
    };
  };


  const [data, setData] = useState<RoastingData>(getInitialState);
  const [results, setResults] = useState<RorResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((stage: Stage, field: keyof RoastingInput, value: string) => {
    if (stage === 'yellow' && field === 'temp') {
        localStorage.setItem(YELLOW_TEMP_KEY, value);
    }
    if (stage === 'fc' && field === 'temp') {
        localStorage.setItem(FC_TEMP_KEY, value);
    }
      
    setData(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value
      }
    }));
  }, []);

  const handleCalculate = () => {
    setError(null);
    setResults(null);

    const stages: Stage[] = ['tp', 'yellow', 'fc', 'drop'];
    const parsedData: { [key in Stage]?: { temp: number, time: number } } = {};

    for (const stage of stages) {
        const temp = parseFloat(data[stage].temp);
        const time = parseTimeToSeconds(data[stage].time);
        
        if (isNaN(temp) || time === null || time < 0) {
            setError(`${stageToKorean(stage)} 입력이 잘못되었습니다. 온도와 시간(MM:SS)을 확인해주세요.`);
            return;
        }
        parsedData[stage] = { temp, time };
    }
    
    const tp = parsedData.tp!;
    const yellow = parsedData.yellow!;
    const fc = parsedData.fc!;
    const drop = parsedData.drop!;

    if (!(tp.time < yellow.time && yellow.time < fc.time && fc.time < drop.time)) {
        setError('시간은 순서대로여야 합니다: TP < 옐로우 < 1차 크랙 < 배출.');
        return;
    }

    if (!(tp.temp < yellow.temp && yellow.temp < fc.temp && fc.temp <= drop.temp)) {
        setError('온도는 일반적으로 상승해야 합니다: TP < 옐로우 < 1차 크랙 <= 배출.');
        return;
    }

    // Phase 1: TP -> Yellow
    const durationSec1 = yellow.time - tp.time;
    const durationMin1 = durationSec1 / 60;
    const tempDiff1 = yellow.temp - tp.temp;
    const ror1 = durationMin1 > 0 ? tempDiff1 / durationMin1 : 0;

    // Phase 2: Yellow -> First Crack
    const durationSec2 = fc.time - yellow.time;
    const durationMin2 = durationSec2 / 60;
    const tempDiff2 = fc.temp - yellow.temp;
    const ror2 = durationMin2 > 0 ? tempDiff2 / durationMin2 : 0;

    // Phase 3: First Crack -> Drop
    const durationSec3 = drop.time - fc.time;
    const durationMin3 = durationSec3 / 60;
    const tempDiff3 = drop.temp - fc.temp;
    const ror3 = durationMin3 > 0 ? tempDiff3 / durationMin3 : 0;

    const totalDurationSec = drop.time - tp.time;
    const percentage1 = totalDurationSec > 0 ? (durationSec1 / totalDurationSec) * 100 : 0;
    const percentage2 = totalDurationSec > 0 ? (durationSec2 / totalDurationSec) * 100 : 0;
    const percentage3 = totalDurationSec > 0 ? (durationSec3 / totalDurationSec) * 100 : 0;
    
    setResults([
        {
            phase: 'TP ➔ 옐로우',
            duration: formatSecondsToTime(durationSec1),
            ror: ror1,
            percentage: percentage1,
        },
        {
            phase: '옐로우 ➔ 1차 크랙',
            duration: formatSecondsToTime(durationSec2),
            ror: ror2,
            percentage: percentage2,
        },
        {
            phase: '1차 크랙 ➔ 배출',
            duration: formatSecondsToTime(durationSec3),
            ror: ror3,
            percentage: percentage3,
        }
    ]);
  };

  const handleReset = () => {
    setData({
      tp: { temp: '', time: '' },
      yellow: { temp: data.yellow.temp, time: '' },
      fc: { temp: data.fc.temp, time: '' },
      drop: { temp: '', time: '' },
    });
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-300">로스팅 ROR 계산기</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">커피 로스팅 프로파일을 분석하세요.</p>
        </header>

        <main className="bg-gray-50 dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
            <div className="space-y-4">
                <InputGroup stage="tp" label="터닝 포인트 (TP)" data={data.tp} onChange={handleInputChange} />
                <InputGroup stage="yellow" label="옐로우 구간" data={data.yellow} onChange={handleInputChange} />
                <InputGroup stage="fc" label="1차 크랙 (FC)" data={data.fc} onChange={handleInputChange} />
                <InputGroup stage="drop" label="배출 (Drop)" data={data.drop} onChange={handleInputChange} />
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md">
                <p>{error}</p>
              </div>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleCalculate}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                >
                    <FireIcon className="h-5 w-5" />
                    ROR 계산
                </button>
                <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition"
                >
                    초기화
                </button>
            </div>

            {results && (
                <section className="mt-8" aria-labelledby="analysis-heading">
                     <h2 id="analysis-heading" className="text-2xl font-semibold text-center text-amber-900 dark:text-amber-300 mb-4">로스팅 프로파일 분석</h2>
                     <ResultsTable results={results} />
                </section>
            )}
        </main>
      </div>
    </div>
  );
}