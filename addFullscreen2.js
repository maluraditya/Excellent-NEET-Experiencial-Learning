import fs from 'fs';

const appFile = 'App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

let modified = content.replace(
    /<div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">([\s\S]*?)<div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">([\s\S]*?)<\/div>\s*<div className="relative/g,
    (match, p1, p2) => {
        return `<div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>${p1}<div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">${p2}
                  <button 
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div className="relative`;
    }
);

fs.writeFileSync('App_modified2.tsx', modified);
console.log('Done modifying. Wrote to App_modified2.tsx.');
