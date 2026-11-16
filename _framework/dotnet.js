//! Licensed to the .NET Foundation under one or more agreements.
//! The .NET Foundation licenses this file to you under the MIT license.

const e=()=>(async()=>{try{return new WebAssembly.Module(Uint8Array.from(atob("AGFzbQEAAAABBAFgAAADAgEAChABDgACaR9AAQMAAAsACxoL"),e=>e.codePointAt(0))),!0}catch(e){return!1}})(),o=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,15,1,13,0,65,1,253,15,65,2,253,15,253,128,2,11])),t=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])),n=Symbol.for("wasm promise_control");function r(e,o){let t=null;const r=new Promise(function(n,r){t={isDone:!1,promise:null,resolve:o=>{t.isDone||(t.isDone=!0,n(o),e&&e())},reject:e=>{t.isDone||(t.isDone=!0,r(e),o&&o())}}});t.promise=r;const s=r;return s[n]=t,{promise:s,promise_control:t}}function s(e){return e[n]}function i(e){e&&function(e){return void 0!==e[n]}(e)||We(!1,"Promise is not controllable")}const a="__mono_message__",l=["debug","log","trace","warn","info","error"],c="MONO_WASM: ";let d,u,f,m,g,p;function h(e){m=e}function b(e){if(ke.diagnosticTracing){const o="function"==typeof e?e():e;console.debug(c+o)}}function w(e,...o){console.info(c+e,...o)}function y(e,...o){console.info(e,...o)}function v(e,...o){console.warn(c+e,...o)}function _(e,...o){if(o&&o.length>0&&o[0]&&"object"==typeof o[0]){if(o[0].silent)return;if(o[0].toString)return void console.error(c+e,o[0].toString())}console.error(c+e,...o)}function A(e,o,t){return function(...n){try{let r=n[0];if(void 0===r)r="undefined";else if(null===r)r="null";else if("function"==typeof r)r=r.toString();else if("string"!=typeof r)try{r=JSON.stringify(r)}catch(e){r=r.toString()}o(t?JSON.stringify({method:e,payload:r,arguments:n.slice(1)}):[e+r,...n.slice(1)])}catch(e){f.error(`proxyConsole failed: ${e}`)}}}function x(e,o,t){u=o,m=e,f={...o};const n=`${t}/console`.replace("https://","wss://").replace("http://","ws://");d=new WebSocket(n),d.addEventListener("error",E),d.addEventListener("close",j),function(){for(const e of l)u[e]=A(`console.${e}`,R,!0)}()}function T(e){let o=30;const t=()=>{d?0==d.bufferedAmount||0==o?(e&&y(e),function(){for(const e of l)u[e]=A(`console.${e}`,f.log,!1)}(),d.removeEventListener("error",E),d.removeEventListener("close",j),d.close(1e3,e),d=void 0):(o--,globalThis.setTimeout(t,100)):e&&f&&f.log(e)};t()}function R(e){d&&d.readyState===WebSocket.OPEN?d.send(e):f.log(e)}function E(e){f.error(`[${m}] proxy console websocket error: ${e}`,e)}function j(e){f.debug(`[${m}] proxy console websocket closed: ${e}`,e)}function D(){ke.preferredIcuAsset=C(ke.config);let e="invariant"==ke.config.globalizationMode;if(!e)if(ke.preferredIcuAsset)ke.diagnosticTracing&&b("ICU data archive(s) available, disabling invariant mode");else{if("custom"===ke.config.globalizationMode||"all"===ke.config.globalizationMode||"sharded"===ke.config.globalizationMode){const e="invariant globalization mode is inactive and no ICU data archives are available";throw _(`ERROR: ${e}`),new Error(e)}ke.diagnosticTracing&&b("ICU data archive(s) not available, using invariant globalization mode"),e=!0,ke.preferredIcuAsset=null}const o="DOTNET_SYSTEM_GLOBALIZATION_INVARIANT",t=ke.config.environmentVariables;if(void 0===t[o]&&e&&(t[o]="1"),void 0===t.TZ)try{const e=Intl.DateTimeFormat().resolvedOptions().timeZone||null;e&&(t.TZ=e)}catch(e){w("failed to detect timezone, will fallback to UTC")}}function C(e){var o;if((null===(o=e.resources)||void 0===o?void 0:o.icu)&&"invariant"!=e.globalizationMode){const o=e.applicationCulture||(Me?globalThis.navigator&&globalThis.navigator.languages&&globalThis.navigator.languages[0]:Intl.DateTimeFormat().resolvedOptions().locale);e.applicationCulture||(e.applicationCulture=o);const t=e.resources.icu;let n=null;if("custom"===e.globalizationMode){if(t.length>=1)return t[0].name}else o&&"all"!==e.globalizationMode?"sharded"===e.globalizationMode&&(n=function(e){const o=e.split("-")[0];return"en"===o||["fr","fr-FR","it","it-IT","de","de-DE","es","es-ES"].includes(e)?"icudt_EFIGS.dat":["zh","ko","ja"].includes(o)?"icudt_CJK.dat":"icudt_no_CJK.dat"}(o)):n="icudt.dat";if(n)for(let e=0;e<t.length;e++){const o=t[e];if(o.virtualPath===n)return o.name}}return e.globalizationMode="invariant",null}(new Date).valueOf();const M=class{constructor(e){this.url=e}toString(){return this.url}};async function S(e){if(Se&&"function"!=typeof globalThis.atob){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";globalThis.atob=o=>{const t=String(o).replace(/=+$/,"");let n="";for(let o=0,r=0,s=0;s<t.length;s++){const i=e.indexOf(t.charAt(s));-1!==i&&(r=o%4?64*r+i:i,o++%4&&(n+=String.fromCharCode(255&r>>(-2*o&6))))}return n}}if(Ee){const e=await import(/*! webpackIgnore: true */"process"),o=14;if(e.versions.node.split(".")[0]<o)throw new Error(`NodeJS at '${e.execPath}' has too low version '${e.versions.node}', please use at least ${o}.`)}const o=/*! webpackIgnore: true */import.meta.url,t=o.indexOf("?");var n;if(t>0&&(ke.modulesUniqueQuery=o.substring(t)),ke.scriptUrl=o.replace(/\\/g,"/").replace(/[?#].*/,""),ke.scriptDirectory=(n=ke.scriptUrl).slice(0,n.lastIndexOf("/"))+"/",ke.locateFile=e=>"URL"in globalThis&&globalThis.URL!==M?new URL(e,ke.scriptDirectory).toString():I(e)?e:ke.scriptDirectory+e,ke.fetch_like=U,ke.out=console.log,ke.err=console.error,ke.onDownloadResourceProgress=e.onDownloadResourceProgress,Me&&globalThis.navigator){const e=globalThis.navigator,o=e.userAgentData&&e.userAgentData.brands;o&&o.length>0?ke.isChromium=o.some(e=>"Google Chrome"===e.brand||"Microsoft Edge"===e.brand||"Chromium"===e.brand):e.userAgent&&(ke.isChromium=e.userAgent.includes("Chrome"),ke.isFirefox=e.userAgent.includes("Firefox"))}void 0===globalThis.URL&&(globalThis.URL=M)}async function U(e,o){try{const t="function"==typeof globalThis.fetch;if(Ee){const n=e.startsWith("file://");if(!n&&t)return globalThis.fetch(e,o||{credentials:"same-origin"});g||(p=await import(/*! webpackIgnore: true */"url"),g=await import(/*! webpackIgnore: true */"fs")),n&&(e=p.fileURLToPath(e));const r=await g.promises.readFile(e);return{ok:!0,headers:{length:0,get:()=>null},url:e,arrayBuffer:()=>r,json:()=>JSON.parse(r),text:()=>{throw new Error("NotImplementedException")}}}if(t)return globalThis.fetch(e,o||{credentials:"same-origin"});if("function"==typeof read)return{ok:!0,url:e,headers:{length:0,get:()=>null},arrayBuffer:()=>new Uint8Array(read(e,"binary")),json:()=>JSON.parse(read(e,"utf8")),text:()=>read(e,"utf8")}}catch(o){return{ok:!1,url:e,status:500,headers:{length:0,get:()=>null},statusText:"ERR28: "+o,arrayBuffer:()=>{throw o},json:()=>{throw o},text:()=>{throw o}}}throw new Error("No fetch implementation available")}const P=/^[a-zA-Z][a-zA-Z\d+\-.]*?:\/\//,k=/[a-zA-Z]:[\\/]/;function I(e){return Ee||Se?e.startsWith("/")||e.startsWith("\\")||-1!==e.indexOf("///")||k.test(e):P.test(e)}let O,$=0;const L=[],N=[],z=new Map,F={"js-module-runtime":!0,"js-module-dotnet":!0,"js-module-native":!0,"js-module-diagnostics":!0},W={...F,"js-module-library-initializer":!0},V={...F,dotnetwasm:!0,heap:!0,manifest:!0},B={...W,manifest:!0},J={...W,dotnetwasm:!0},H={dotnetwasm:!0,symbols:!0},Q={...W,dotnetwasm:!0,symbols:!0},q={symbols:!0};function G(e){return!("icu"==e.behavior&&e.name!=ke.preferredIcuAsset)}function Z(e,o,t){null!=o||(o=[]),We(1==o.length,`Expect to have one ${t} asset in resources`);const n=o[0];return n.behavior=t,K(n),e.push(n),n}function K(e){V[e.behavior]&&z.set(e.behavior,e)}function X(e){We(V[e],`Unknown single asset behavior ${e}`);const o=z.get(e);if(o&&!o.resolvedUrl)if(o.resolvedUrl=ke.locateFile(o.name),F[o.behavior]){const e=me(o);e?("string"!=typeof e&&We(!1,"loadBootResource response for 'dotnetjs' type should be a URL string"),o.resolvedUrl=e):o.resolvedUrl=le(o.resolvedUrl,o.behavior)}else if("dotnetwasm"!==o.behavior)throw new Error(`Unknown single asset behavior ${e}`);return o}function Y(e){const o=X(e);return We(o,`Single asset for ${e} not found`),o}let ee=!1;async function oe(){if(!ee){ee=!0,ke.diagnosticTracing&&b("mono_download_assets");try{const e=[],o=[],t=(e,o)=>{!Q[e.behavior]&&G(e)&&ke.expected_instantiated_assets_count++,!J[e.behavior]&&G(e)&&(ke.expected_downloaded_assets_count++,o.push(se(e)))};for(const o of L)t(o,e);for(const e of N)t(e,o);ke.allDownloadsQueued.promise_control.resolve(),Promise.all([...e,...o]).then(()=>{ke.allDownloadsFinished.promise_control.resolve()}).catch(e=>{throw ke.err("Error in mono_download_assets: "+e),Xe(1,e),e}),await ke.runtimeModuleLoaded.promise;const n=async e=>{const o=await e;if(H[o.behavior])return"symbols"===o.behavior&&(await Pe.instantiate_symbols_asset(o),ge(o)),void++ke.actual_downloaded_assets_count;if(o.buffer){if(!Q[o.behavior]){o.buffer&&"object"==typeof o.buffer||We(!1,"asset buffer must be array-like or buffer-like or promise of these"),"string"!=typeof o.resolvedUrl&&We(!1,"resolvedUrl must be string");const e=o.resolvedUrl,t=await o.buffer,n=new Uint8Array(t);ge(o),await Pe.beforeOnRuntimeInitialized.promise,await Pe.afterInstantiateWasm.promise,Pe.instantiate_asset(o,e,n)}}else o.isOptional||We(!1,"Expected asset to have the downloaded buffer"),!J[o.behavior]&&G(o)&&ke.expected_downloaded_assets_count--,!Q[o.behavior]&&G(o)&&ke.expected_instantiated_assets_count--},r=[],s=[];for(const o of e)r.push(n(o));for(const e of o)s.push(n(e));Promise.all(r).then(()=>{Ce||Pe.coreAssetsInMemory.promise_control.resolve()}).catch(e=>{throw ke.err("Error in mono_download_assets: "+e),Xe(1,e),e}),Promise.all(s).then(async()=>{Ce||(await Pe.coreAssetsInMemory.promise,Pe.allAssetsInMemory.promise_control.resolve())}).catch(e=>{throw ke.err("Error in mono_download_assets: "+e),Xe(1,e),e})}catch(e){throw ke.err("Error in mono_download_assets: "+e),e}}}let te=!1;function ne(){if(te)return;te=!0;const e=ke.config,o=[];if(e.assets)for(const o of e.assets)"object"!=typeof o&&We(!1,`asset must be object, it was ${typeof o} : ${o}`),"string"!=typeof o.behavior&&We(!1,"asset behavior must be known string"),"string"!=typeof o.name&&We(!1,"asset name must be string"),o.resolvedUrl&&"string"!=typeof o.resolvedUrl&&We(!1,"asset resolvedUrl could be string"),o.hash&&"string"!=typeof o.hash&&We(!1,"asset resolvedUrl could be string"),o.pendingDownload&&"object"!=typeof o.pendingDownload&&We(!1,"asset pendingDownload could be object"),o.isCore?L.push(o):N.push(o),K(o);else if(e.resources){const t=e.resources;t.wasmNative||We(!1,"resources.wasmNative must be defined"),t.jsModuleNative||We(!1,"resources.jsModuleNative must be defined"),t.jsModuleRuntime||We(!1,"resources.jsModuleRuntime must be defined"),Z(N,t.wasmNative,"dotnetwasm"),Z(o,t.jsModuleNative,"js-module-native"),Z(o,t.jsModuleRuntime,"js-module-runtime"),t.jsModuleDiagnostics&&Z(o,t.jsModuleDiagnostics,"js-module-diagnostics");const n=(e,o,t)=>{const n=e;n.behavior=o,t?(n.isCore=!0,L.push(n)):N.push(n)};if(t.coreAssembly)for(let e=0;e<t.coreAssembly.length;e++)n(t.coreAssembly[e],"assembly",!0);if(t.assembly)for(let e=0;e<t.assembly.length;e++)n(t.assembly[e],"assembly",!t.coreAssembly);if(0!=e.debugLevel&&ke.isDebuggingSupported()){if(t.corePdb)for(let e=0;e<t.corePdb.length;e++)n(t.corePdb[e],"pdb",!0);if(t.pdb)for(let e=0;e<t.pdb.length;e++)n(t.pdb[e],"pdb",!t.corePdb)}if(e.loadAllSatelliteResources&&t.satelliteResources)for(const e in t.satelliteResources)for(let o=0;o<t.satelliteResources[e].length;o++){const r=t.satelliteResources[e][o];r.culture=e,n(r,"resource",!t.coreAssembly)}if(t.coreVfs)for(let e=0;e<t.coreVfs.length;e++)n(t.coreVfs[e],"vfs",!0);if(t.vfs)for(let e=0;e<t.vfs.length;e++)n(t.vfs[e],"vfs",!t.coreVfs);const r=C(e);if(r&&t.icu)for(let e=0;e<t.icu.length;e++){const o=t.icu[e];o.name===r&&n(o,"icu",!1)}if(t.wasmSymbols)for(let e=0;e<t.wasmSymbols.length;e++)n(t.wasmSymbols[e],"symbols",!1)}if(e.appsettings)for(let o=0;o<e.appsettings.length;o++){const t=e.appsettings[o],n=pe(t);"appsettings.json"!==n&&n!==`appsettings.${e.applicationEnvironment}.json`||N.push({name:t,behavior:"vfs",cache:"no-cache",useCredentials:!0})}e.assets=[...L,...N,...o]}async function re(e){const o=await se(e);return await o.pendingDownloadInternal.response,o.buffer}async function se(e){try{return await ie(e)}catch(o){if(!ke.enableDownloadRetry)throw o;if(Se||Ee)throw o;if(e.pendingDownload&&e.pendingDownloadInternal==e.pendingDownload)throw o;if(e.resolvedUrl&&-1!=e.resolvedUrl.indexOf("file://"))throw o;if(o&&404==o.status)throw o;e.pendingDownloadInternal=void 0,await ke.allDownloadsQueued.promise;try{return ke.diagnosticTracing&&b(`Retrying download '${e.name}'`),await ie(e)}catch(o){return e.pendingDownloadInternal=void 0,await new Promise(e=>globalThis.setTimeout(e,100)),ke.diagnosticTracing&&b(`Retrying download (2) '${e.name}' after delay`),await ie(e)}}}async function ie(e){for(;O;)await O.promise;try{++$,$==ke.maxParallelDownloads&&(ke.diagnosticTracing&&b("Throttling further parallel downloads"),O=r());const o=await async function(e){if(e.pendingDownload&&(e.pendingDownloadInternal=e.pendingDownload),e.pendingDownloadInternal&&e.pendingDownloadInternal.response)return e.pendingDownloadInternal.response;if(e.buffer){const o=await e.buffer;return e.resolvedUrl||(e.resolvedUrl="undefined://"+e.name),e.pendingDownloadInternal={url:e.resolvedUrl,name:e.name,response:Promise.resolve({ok:!0,arrayBuffer:()=>o,json:()=>JSON.parse(new TextDecoder("utf-8").decode(o)),text:()=>new TextDecoder("utf-8").decode(o),headers:{get:()=>{}}})},e.pendingDownloadInternal.response}const o=e.loadRemote&&ke.config.remoteSources?ke.config.remoteSources:[""];let t;for(let n of o){n=n.trim(),"./"===n&&(n="");const o=ae(e,n);e.name===o?ke.diagnosticTracing&&b(`Attempting to download '${o}'`):ke.diagnosticTracing&&b(`Attempting to download '${o}' for ${e.name}`);try{e.resolvedUrl=o;const n=ue(e);if(e.pendingDownloadInternal=n,t=await n.response,!t||!t.ok)continue;return t}catch(e){t||(t={ok:!1,url:o,status:0,statusText:""+e});continue}}const n=e.isOptional||e.name.match(/\.pdb$/)&&ke.config.ignorePdbLoadErrors;if(t||We(!1,`Response undefined ${e.name}`),!n){const o=new Error(`download '${t.url}' for ${e.name} failed ${t.status} ${t.statusText}`);throw o.status=t.status,o}w(`optional download '${t.url}' for ${e.name} failed ${t.status} ${t.statusText}`)}(e);return o?(H[e.behavior]||(e.buffer=await o.arrayBuffer(),++ke.actual_downloaded_assets_count),e):e}finally{if(--$,O&&$==ke.maxParallelDownloads-1){ke.diagnosticTracing&&b("Resuming more parallel downloads");const e=O;O=void 0,e.promise_control.resolve()}}}function ae(e,o){let t;return null==o&&We(!1,`sourcePrefix must be provided for ${e.name}`),e.resolvedUrl?t=e.resolvedUrl:(t=""===o?"assembly"===e.behavior||"pdb"===e.behavior?e.name:"resource"===e.behavior&&e.culture&&""!==e.culture?`${e.culture}/${e.name}`:e.name:o+e.name,t=le(ke.locateFile(t),e.behavior)),t&&"string"==typeof t||We(!1,"attemptUrl need to be path or url string"),t}function le(e,o){return ke.modulesUniqueQuery&&B[o]&&(e+=ke.modulesUniqueQuery),e}let ce=0;const de=new Set;function ue(e){try{e.resolvedUrl||We(!1,"Request's resolvedUrl must be set");const o=function(e){let o=e.resolvedUrl;if(ke.loadBootResource){const t=me(e);if(t instanceof Promise)return t;"string"==typeof t&&(o=t)}const t={};return e.cache?t.cache=e.cache:ke.config.disableNoCacheFetch||(t.cache="no-cache"),e.useCredentials?t.credentials="include":!ke.config.disableIntegrityCheck&&e.hash&&(t.integrity=e.hash),ke.fetch_like(o,t)}(e),t={name:e.name,url:e.resolvedUrl,response:o};return de.add(e.name),t.response.then(()=>{"assembly"==e.behavior&&ke.loadedAssemblies.push(e.name),ce++,ke.onDownloadResourceProgress&&ke.onDownloadResourceProgress(ce,de.size)}),t}catch(o){const t={ok:!1,url:e.resolvedUrl,status:500,statusText:"ERR29: "+o,arrayBuffer:()=>{throw o},json:()=>{throw o}};return{name:e.name,url:e.resolvedUrl,response:Promise.resolve(t)}}}const fe={resource:"assembly",assembly:"assembly",pdb:"pdb",icu:"globalization",vfs:"configuration",manifest:"manifest",dotnetwasm:"dotnetwasm","js-module-dotnet":"dotnetjs","js-module-native":"dotnetjs","js-module-runtime":"dotnetjs"};function me(e){var o;if(ke.loadBootResource){const t=null!==(o=e.hash)&&void 0!==o?o:"",n=e.resolvedUrl,r=fe[e.behavior];if(r){const o=ke.loadBootResource(r,e.name,n,t,e.behavior);return"string"==typeof o?function(e){return"string"!=typeof e&&We(!1,"url must be a string"),!I(e)&&0!==e.indexOf("./")&&0!==e.indexOf("../")&&globalThis.URL&&globalThis.document&&globalThis.document.baseURI&&(e=new URL(e,globalThis.document.baseURI).toString()),e}(o):o}}}function ge(e){e.pendingDownloadInternal=null,e.pendingDownload=null,e.buffer=null,e.moduleExports=null}function pe(e){let o=e.lastIndexOf("/");return o>=0&&o++,e.substring(o)}async function he(e){e&&await Promise.all((null!=e?e:[]).map(e=>async function(e){try{const o=e.name;if(!e.moduleExports){const t=le(ke.locateFile(o),"js-module-library-initializer");ke.diagnosticTracing&&b(`Attempting to import '${t}' for ${e}`),e.moduleExports=await import(/*! webpackIgnore: true */t)}ke.libraryInitializers.push({scriptName:o,exports:e.moduleExports})}catch(o){v(`Failed to import library initializer '${e}': ${o}`)}}(e)))}async function be(e,o){if(!ke.libraryInitializers)return;const t=[];for(let n=0;n<ke.libraryInitializers.length;n++){const r=ke.libraryInitializers[n];r.exports[e]&&t.push(we(r.scriptName,e,()=>r.exports[e](...o)))}await Promise.all(t)}async function we(e,o,t){try{await t()}catch(t){throw v(`Failed to invoke '${o}' on library initializer '${e}': ${t}`),Xe(1,t),t}}function ye(e,o){if(e===o)return e;const t={...o};return void 0!==t.assets&&t.assets!==e.assets&&(t.assets=[...e.assets||[],...t.assets||[]]),void 0!==t.resources&&(t.resources=_e(e.resources||{assembly:[],jsModuleNative:[],jsModuleRuntime:[],wasmNative:[]},t.resources)),void 0!==t.environmentVariables&&(t.environmentVariables={...e.environmentVariables||{},...t.environmentVariables||{}}),void 0!==t.runtimeOptions&&t.runtimeOptions!==e.runtimeOptions&&(t.runtimeOptions=[...e.runtimeOptions||[],...t.runtimeOptions||[]]),Object.assign(e,t)}function ve(e,o){if(e===o)return e;const t={...o};return t.config&&(e.config||(e.config={}),t.config=ye(e.config,t.config)),Object.assign(e,t)}function _e(e,o){if(e===o)return e;const t={...o};return void 0!==t.coreAssembly&&(t.coreAssembly=[...e.coreAssembly||[],...t.coreAssembly||[]]),void 0!==t.assembly&&(t.assembly=[...e.assembly||[],...t.assembly||[]]),void 0!==t.lazyAssembly&&(t.lazyAssembly=[...e.lazyAssembly||[],...t.lazyAssembly||[]]),void 0!==t.corePdb&&(t.corePdb=[...e.corePdb||[],...t.corePdb||[]]),void 0!==t.pdb&&(t.pdb=[...e.pdb||[],...t.pdb||[]]),void 0!==t.jsModuleNative&&(t.jsModuleNative=[...e.jsModuleNative||[],...t.jsModuleNative||[]]),void 0!==t.jsModuleDiagnostics&&(t.jsModuleDiagnostics=[...e.jsModuleDiagnostics||[],...t.jsModuleDiagnostics||[]]),void 0!==t.jsModuleRuntime&&(t.jsModuleRuntime=[...e.jsModuleRuntime||[],...t.jsModuleRuntime||[]]),void 0!==t.wasmSymbols&&(t.wasmSymbols=[...e.wasmSymbols||[],...t.wasmSymbols||[]]),void 0!==t.wasmNative&&(t.wasmNative=[...e.wasmNative||[],...t.wasmNative||[]]),void 0!==t.icu&&(t.icu=[...e.icu||[],...t.icu||[]]),void 0!==t.satelliteResources&&(t.satelliteResources=function(e,o){if(e===o)return e;for(const t in o)e[t]=[...e[t]||[],...o[t]||[]];return e}(e.satelliteResources||{},t.satelliteResources||{})),void 0!==t.modulesAfterConfigLoaded&&(t.modulesAfterConfigLoaded=[...e.modulesAfterConfigLoaded||[],...t.modulesAfterConfigLoaded||[]]),void 0!==t.modulesAfterRuntimeReady&&(t.modulesAfterRuntimeReady=[...e.modulesAfterRuntimeReady||[],...t.modulesAfterRuntimeReady||[]]),void 0!==t.extensions&&(t.extensions={...e.extensions||{},...t.extensions||{}}),void 0!==t.vfs&&(t.vfs=[...e.vfs||[],...t.vfs||[]]),Object.assign(e,t)}function Ae(){const e=ke.config;if(e.environmentVariables=e.environmentVariables||{},e.runtimeOptions=e.runtimeOptions||[],e.resources=e.resources||{assembly:[],jsModuleNative:[],jsModuleRuntime:[],wasmNative:[],vfs:[],satelliteResources:{}},e.assets){ke.diagnosticTracing&&b("config.assets is deprecated, use config.resources instead");for(const o of e.assets){const t={};switch(o.behavior){case"assembly":t.assembly=[o];break;case"pdb":t.pdb=[o];break;case"resource":t.satelliteResources={},t.satelliteResources[o.culture]=[o];break;case"icu":t.icu=[o];break;case"symbols":t.wasmSymbols=[o];break;case"vfs":t.vfs=[o];break;case"dotnetwasm":t.wasmNative=[o];break;case"js-module-runtime":t.jsModuleRuntime=[o];break;case"js-module-native":t.jsModuleNative=[o];break;case"js-module-diagnostics":t.jsModuleDiagnostics=[o];break;case"js-module-dotnet":break;default:throw new Error(`Unexpected behavior ${o.behavior} of asset ${o.name}`)}_e(e.resources,t)}}e.debugLevel,void 0===e.virtualWorkingDirectory&&(e.virtualWorkingDirectory=Ue),e.applicationEnvironment||(e.applicationEnvironment="Production"),e.applicationCulture&&(e.environmentVariables.LANG=`${e.applicationCulture}.UTF-8`),Pe.diagnosticTracing=ke.diagnosticTracing=!!e.diagnosticTracing,Pe.waitForDebugger=e.waitForDebugger,ke.maxParallelDownloads=e.maxParallelDownloads||ke.maxParallelDownloads,ke.enableDownloadRetry=void 0!==e.enableDownloadRetry?e.enableDownloadRetry:ke.enableDownloadRetry}let xe=!1;async function Te(e){var o;if(xe)await ke.afterConfigLoaded.promise;else try{if(xe=!0,Ae(),await he(null===(o=ke.config.resources)||void 0===o?void 0:o.modulesAfterConfigLoaded),await be("onRuntimeConfigLoaded",[ke.config]),e.onConfigLoaded)try{await e.onConfigLoaded(ke.config,Oe),Ae()}catch(e){throw _("onConfigLoaded() failed",e),e}Ae(),ke.afterConfigLoaded.promise_control.resolve(ke.config)}catch(o){const t=`Failed to initialize config ${o} ${null==o?void 0:o.stack}`;throw ke.config=e.config=Object.assign(ke.config,{message:t,error:o,isError:!0}),Xe(1,new Error(t)),o}}function Re(){return!!globalThis.navigator&&(ke.isChromium||ke.isFirefox)}"function"==typeof importScripts&&(globalThis.dotnetSidecar=!0);const Ee="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,je="function"==typeof importScripts,De=je&&"undefined"!=typeof dotnetSidecar,Ce=je&&!De,Me="object"==typeof window||je&&!Ee,Se=!Me&&!Ee,Ue="/";let Pe={},ke={},Ie={},Oe={},$e={},Le=!1;const Ne={},ze={config:Ne},Fe={mono:{},binding:{},internal:$e,module:ze,loaderHelpers:ke,runtimeHelpers:Pe,diagnosticHelpers:Ie,api:Oe};function We(e,o){if(e)return;const t="Assert failed: "+("function"==typeof o?o():o),n=new Error(t);_(t,n),Pe.nativeAbort(n)}function Ve(){return void 0!==ke.exitCode}function Be(){return Pe.runtimeReady&&!Ve()}function Je(){Ve()&&We(!1,`.NET runtime already exited with ${ke.exitCode} ${ke.exitReason}. You can use dotnet.runMain() which doesn't exit the runtime.`),Pe.runtimeReady||We(!1,".NET runtime didn't start yet. Please call dotnet.create() first.")}function He(){Me&&(globalThis.addEventListener("unhandledrejection",eo),globalThis.addEventListener("error",oo))}let Qe,qe;function Ge(){Qe=ze.onAbort,qe=ze.onExit,ze.onAbort=Ke,ze.onExit=Ze}function Ze(e){qe&&qe(e),Xe(e,ke.exitReason)}function Ke(e){Qe&&Qe(e||ke.exitReason),Xe(1,e||ke.exitReason)}function Xe(e,o){var t;const n=o&&"object"==typeof o;e=n&&"number"==typeof o.status?o.status:void 0===e?-1:e;const r=n&&"string"==typeof o.message?o.message:""+o;(o=n?o:Pe.ExitStatus?function(e,o){const t=new Pe.ExitStatus(e);return t.message=o,t.toString=()=>o,t}(e,r):new Error("Exit with code "+e+" "+r)).status=e,o.message||(o.message=r);const s=""+(o.stack||(new Error).stack);try{Object.defineProperty(o,"stack",{get:()=>s})}catch(e){}const i=!!o.silent;if(o.silent=!0,Ve())ke.diagnosticTracing&&b("mono_exit called after exit");else{try{ze.onAbort==Ke&&(ze.onAbort=Qe),ze.onExit==Ze&&(ze.onExit=qe),Me&&(globalThis.removeEventListener("unhandledrejection",eo),globalThis.removeEventListener("error",oo)),Pe.runtimeReady?(Pe.jiterpreter_dump_stats&&Pe.jiterpreter_dump_stats(!1),0===e&&(null===(t=ke.config)||void 0===t?void 0:t.interopCleanupOnExit)&&Pe.forceDisposeProxies(!0,!0)):(ke.diagnosticTracing&&b(`abort_startup, reason: ${o}`),function(e){ke.allDownloadsQueued.promise_control.reject(e),ke.allDownloadsFinished.promise_control.reject(e),ke.afterConfigLoaded.promise_control.reject(e),ke.wasmCompilePromise.promise_control.reject(e),ke.runtimeModuleLoaded.promise_control.reject(e),Pe.dotnetReady&&(Pe.dotnetReady.promise_control.reject(e),Pe.afterInstantiateWasm.promise_control.reject(e),Pe.afterPreRun.promise_control.reject(e),Pe.beforeOnRuntimeInitialized.promise_control.reject(e),Pe.afterOnRuntimeInitialized.promise_control.reject(e),Pe.afterPostRun.promise_control.reject(e))}(o))}catch(e){v("mono_exit A failed",e)}try{i||(function(e,o){if(0!==e&&o){const e=Pe.ExitStatus&&o instanceof Pe.ExitStatus?b:_;"string"==typeof o?e(o):(void 0===o.stack&&(o.stack=(new Error).stack+""),o.message?e(Pe.stringify_as_error_with_stack?Pe.stringify_as_error_with_stack(o.message+"\n"+o.stack):o.message+"\n"+o.stack):e(JSON.stringify(o)))}!Ce&&ke.config&&(ke.config.logExitCode?ke.config.forwardConsole?T("WASM EXIT "+e):y("WASM EXIT "+e):ke.config.forwardConsole&&T())}(e,o),function(e){if(Me&&!Ce&&ke.config&&ke.config.appendElementOnExit&&document){const o=document.createElement("label");o.id="tests_done",0!==e&&(o.style.background="red"),o.innerHTML=""+e,document.body.appendChild(o)}}(e))}catch(e){v("mono_exit B failed",e)}ke.exitCode=e,ke.exitReason||(ke.exitReason=o),!Ce&&Pe.runtimeReady&&ze.runtimeKeepalivePop()}if(ke.config&&ke.config.asyncFlushOnExit&&0===e)throw(async()=>{try{await async function(){if(Ee)try{const e=await import(/*! webpackIgnore: true */"process"),o=e=>new Promise((o,t)=>{e.on("error",t),e.end("","utf8",o)}),t=o(e.stderr),n=o(e.stdout);let r;const s=new Promise(e=>{r=setTimeout(()=>e("timeout"),1e3)});await Promise.race([Promise.all([n,t]),s]),clearTimeout(r)}catch(e){_(`flushing std* streams failed: ${e}`)}}()}finally{Ye(e,o)}})(),o;Ye(e,o)}function Ye(e,o){if(Pe.runtimeReady&&Pe.nativeExit)try{Pe.nativeExit(e)}catch(e){!Pe.ExitStatus||e instanceof Pe.ExitStatus||v("set_exit_code_and_quit_now failed: "+e.toString())}if(0!==e||!Me)throw Ee?process.exit(e):Pe.quit&&Pe.quit(e,o),o}function eo(e){to(e,e.reason,"rejection")}function oo(e){to(e,e.error,"error")}function to(e,o,t){e.preventDefault();try{o||(o=new Error("Unhandled "+t)),void 0===o.stack&&(o.stack=(new Error).stack),o.stack=o.stack+"",o.silent||(_("Unhandled error:",o),Xe(1,o))}catch(e){}}!function(n){if(Le)throw new Error("Loader module already loaded");Le=!0,Pe=n.runtimeHelpers,ke=n.loaderHelpers,Ie=n.diagnosticHelpers,Oe=n.api,$e=n.internal,Object.assign(Oe,{INTERNAL:$e,invokeLibraryInitializers:be}),Object.assign(n.module,{config:ye(Ne,{environmentVariables:{}})});const a={mono_wasm_bindings_is_ready:!1,config:n.module.config,diagnosticTracing:!1,nativeAbort:e=>{throw e||new Error("abort")},nativeExit:e=>{throw new Error("exit:"+e)}},l={gitHash:"297acf930fb0f5c07fd4e51d78e521b4ad2e5d1f",config:n.module.config,diagnosticTracing:!1,maxParallelDownloads:16,enableDownloadRetry:!0,_loaded_files:[],loadedFiles:[],loadedAssemblies:[],libraryInitializers:[],workerNextNumber:1,actual_downloaded_assets_count:0,actual_instantiated_assets_count:0,expected_downloaded_assets_count:0,expected_instantiated_assets_count:0,afterConfigLoaded:r(),allDownloadsQueued:r(),allDownloadsFinished:r(),wasmCompilePromise:r(),runtimeModuleLoaded:r(),loadingWorkers:r(),is_exited:Ve,is_runtime_running:Be,assert_runtime_running:Je,mono_exit:Xe,createPromiseController:r,getPromiseController:s,assertIsControllablePromise:i,mono_download_assets:oe,resolve_single_asset_path:Y,setup_proxy_console:x,set_thread_prefix:h,installUnhandledErrorHandler:He,retrieve_asset_download:re,invokeLibraryInitializers:be,isDebuggingSupported:Re,exceptionsFinal:e,simd:t,relaxedSimd:o};Object.assign(Pe,a),Object.assign(ke,l)}(Fe);let no,ro,so,io=!1,ao=!1;async function lo(e){if(!ao){if(ao=!0,Me&&ke.config.forwardConsole&&void 0!==globalThis.WebSocket&&x("main",globalThis.console,globalThis.location.origin),ze||We(!1,"Null moduleConfig"),ke.config||We(!1,"Null moduleConfig.config"),"function"==typeof e){const o=e(Fe.api);if(o.ready)throw new Error("Module.ready couldn't be redefined.");Object.assign(ze,o),ve(ze,o)}else{if("object"!=typeof e)throw new Error("Can't use moduleFactory callback of createDotnetRuntime function.");ve(ze,e)}await S(ze)}}async function co(e){return await lo(e),ke.config.exitOnUnhandledError&&He(),Ge(),async function(){var e;await Te(ze),ne();const o=uo();(async function(){try{const e=Y("dotnetwasm");await se(e),e&&e.pendingDownloadInternal&&e.pendingDownloadInternal.response||We(!1,"Can't load dotnet.native.wasm");const o=await e.pendingDownloadInternal.response,t=o.headers&&o.headers.get?o.headers.get("Content-Type"):void 0;let n;if("function"==typeof WebAssembly.compileStreaming&&"application/wasm"===t)n=await WebAssembly.compileStreaming(o);else{Me&&"application/wasm"!==t&&v('WebAssembly resource does not have the expected content type "application/wasm", so falling back to slower ArrayBuffer instantiation.');const e=await o.arrayBuffer();ke.diagnosticTracing&&b("instantiate_wasm_module buffered"),n=Se?await Promise.resolve(new WebAssembly.Module(e)):await WebAssembly.compile(e)}e.pendingDownloadInternal=null,e.pendingDownload=null,e.buffer=null,e.moduleExports=null,ke.wasmCompilePromise.promise_control.resolve(n)}catch(e){ke.wasmCompilePromise.promise_control.reject(e)}})(),setTimeout(async()=>{try{D(),await oe()}catch(e){Xe(1,e)}},0);const t=await Promise.all(o);return await fo(t),await Pe.dotnetReady.promise,await he(null===(e=ke.config.resources)||void 0===e?void 0:e.modulesAfterRuntimeReady),await be("onRuntimeReady",[Fe.api]),Oe}()}function uo(){const e=Y("js-module-runtime"),o=Y("js-module-native");if(no&&ro)return[no,ro,so];"object"==typeof e.moduleExports?no=e.moduleExports:(ke.diagnosticTracing&&b(`Attempting to import '${e.resolvedUrl}' for ${e.name}`),no=import(/*! webpackIgnore: true */e.resolvedUrl)),"object"==typeof o.moduleExports?ro=o.moduleExports:(ke.diagnosticTracing&&b(`Attempting to import '${o.resolvedUrl}' for ${o.name}`),ro=import(/*! webpackIgnore: true */o.resolvedUrl));const t=X("js-module-diagnostics");return t&&("object"==typeof t.moduleExports?so=t.moduleExports:(ke.diagnosticTracing&&b(`Attempting to import '${t.resolvedUrl}' for ${t.name}`),so=import(/*! webpackIgnore: true */t.resolvedUrl))),[no,ro,so]}async function fo(e){const{initializeExports:o,initializeReplacements:t,configureRuntimeStartup:n,configureEmscriptenStartup:r,configureWorkerStartup:s,setRuntimeGlobals:i,passEmscriptenInternals:a}=e[0],{default:l}=e[1],c=e[2];i(Fe),o(Fe),c&&c.setRuntimeGlobals(Fe),await n(ze),ke.runtimeModuleLoaded.promise_control.resolve(),l(()=>(Object.assign(ze,{__dotnet_runtime:{initializeReplacements:t,configureEmscriptenStartup:r,configureWorkerStartup:s,passEmscriptenInternals:a}}),ze)).catch(e=>{if(e.message&&e.message.toLowerCase().includes("out of memory"))throw new Error(".NET runtime has failed to start, because too much memory was requested. Please decrease the memory by adjusting EmccMaximumHeapSize.");throw e})}Ce&&async function(){(function(){const e=new MessageChannel,o=e.port1,t=e.port2;o.addEventListener("message",e=>{!function(e){const o=JSON.parse(e.config),t=JSON.parse(e.monoThreadInfo);ze.config=o,ze.wasmModule=e.wasmModule,ze.wasmMemory=e.wasmMemory,ze.handlers=e.handlers,io?ke.diagnosticTracing&&b("mono config already received"):(ye(ke.config,o),Pe.monoThreadInfo=t,Ae(),ke.diagnosticTracing&&b("mono config received"),io=!0,ke.afterConfigLoaded.promise_control.resolve(ke.config),Me&&o.forwardConsole&&void 0!==globalThis.WebSocket&&ke.setup_proxy_console("worker-idle",console,globalThis.location.origin))}(e.data),o.close(),t.close()},{once:!0}),o.start(),self.postMessage({[a]:{monoCmd:"preload",port:t}},[t])})(),await ke.afterConfigLoaded.promise,function(){const e=ke.config;e.assets||We(!1,"config.assets must be defined");for(const o of e.assets)K(o),q[o.behavior]&&N.push(o)}();const e=uo(),o=await Promise.all(e);return globalThis.name="em-pthread",await fo(o),ke.config.exitOnUnhandledError&&He(),Ge(),Me&&ke.config.forwardConsole&&void 0!==globalThis.WebSocket&&x("main",globalThis.console,globalThis.location.origin),await S(ze),await oe(),self.dispatchEvent(new MessageEvent("message",{data:{cmd:1,handlers:ze.handlers,wasmMemory:ze.wasmMemory,wasmModule:ze.wasmModule}})),ze}().catch(e=>Xe(1,e));const mo=new class{withModuleConfig(e){try{return ve(ze,e),this}catch(e){throw Xe(1,e),e}}withInterpreterPgo(e,o){try{return ye(Ne,{interpreterPgo:e,interpreterPgoSaveDelay:o}),Ne.runtimeOptions?Ne.runtimeOptions.push("--interp-pgo-recording"):Ne.runtimeOptions=["--interp-pgo-recording"],this}catch(e){throw Xe(1,e),e}}withConfig(e){try{return ye(Ne,e),this}catch(e){throw Xe(1,e),e}}withConfigSrc(e){return this}withVirtualWorkingDirectory(e){try{return e&&"string"==typeof e||We(!1,"must be directory path"),ye(Ne,{virtualWorkingDirectory:e}),this}catch(e){throw Xe(1,e),e}}withEnvironmentVariable(e,o){try{const t={};return t[e]=o,ye(Ne,{environmentVariables:t}),this}catch(e){throw Xe(1,e),e}}withEnvironmentVariables(e){try{return e&&"object"==typeof e||We(!1,"must be dictionary object"),ye(Ne,{environmentVariables:e}),this}catch(e){throw Xe(1,e),e}}withDiagnosticTracing(e){try{return"boolean"!=typeof e&&We(!1,"must be boolean"),ye(Ne,{diagnosticTracing:e}),this}catch(e){throw Xe(1,e),e}}withDebugging(e){try{return null!=e&&"number"==typeof e||We(!1,"must be number"),ye(Ne,{debugLevel:e}),this}catch(e){throw Xe(1,e),e}}withApplicationArguments(...e){try{return e&&Array.isArray(e)||We(!1,"must be array of strings"),ye(Ne,{applicationArguments:e}),this}catch(e){throw Xe(1,e),e}}withRuntimeOptions(e){try{return e&&Array.isArray(e)||We(!1,"must be array of strings"),Ne.runtimeOptions?Ne.runtimeOptions.push(...e):Ne.runtimeOptions=e,this}catch(e){throw Xe(1,e),e}}withMainAssembly(e){try{return ye(Ne,{mainAssemblyName:e}),this}catch(e){throw Xe(1,e),e}}withApplicationArgumentsFromQuery(){try{if(!globalThis.window)throw new Error("Missing window to the query parameters from");if(void 0===globalThis.URLSearchParams)throw new Error("URLSearchParams is supported");const e=new URLSearchParams(globalThis.window.location.search).getAll("arg");return this.withApplicationArguments(...e)}catch(e){throw Xe(1,e),e}}withApplicationEnvironment(e){try{return ye(Ne,{applicationEnvironment:e}),this}catch(e){throw Xe(1,e),e}}withApplicationCulture(e){try{return ye(Ne,{applicationCulture:e}),this}catch(e){throw Xe(1,e),e}}withResourceLoader(e){try{return ke.loadBootResource=e,this}catch(e){throw Xe(1,e),e}}async download(){try{await async function(){lo(ze),await Te(ze),ne(),D(),oe(),await ke.allDownloadsFinished.promise}()}catch(e){throw Xe(1,e),e}}async create(){try{return this.instance||(this.instance=await async function(){return await co(ze),Fe.api}()),this.instance}catch(e){throw Xe(1,e),e}}run(){return this.runMainAndExit()}async runMainAndExit(){try{return ze.config||We(!1,"Null moduleConfig.config"),this.instance||await this.create(),this.instance.runMainAndExit()}catch(e){throw Xe(1,e),e}}async runMain(){try{return ze.config||We(!1,"Null moduleConfig.config"),this.instance||await this.create(),this.instance.runMain()}catch(e){throw Xe(1,e),e}}},go=Xe,po=co;Se||"function"==typeof globalThis.URL||We(!1,"This browser/engine doesn't support URL API. Please use a modern version."),"function"!=typeof globalThis.BigInt64Array&&We(!1,"This browser/engine doesn't support BigInt64Array API. Please use a modern version. See also https://learn.microsoft.com/aspnet/core/blazor/supported-platforms"),globalThis.performance&&"function"==typeof globalThis.performance.now||We(!1,"This browser/engine doesn't support performance.now. Please use a modern version."),Se||globalThis.crypto&&"object"==typeof globalThis.crypto.subtle||We(!1,"This engine doesn't support crypto.subtle. Please use a modern version."),Se||globalThis.crypto&&"function"==typeof globalThis.crypto.getRandomValues||We(!1,"This engine doesn't support crypto.getRandomValues. Please use a modern version."),Ee&&"function"!=typeof process.exit&&We(!1,"This engine doesn't support process.exit. Please use a modern version."),mo.withConfig(/*json-start*/{
  "mainAssemblyName": "Tavenem.Blazor.Framework.Docs",
  "resources": {
    "hash": "sha256-wmOEx9VAOAgd5sCB7YKbbOxlA0kvAOkDqgdrejXBCgU=",
    "jsModuleNative": [
      {
        "name": "dotnet.native.gyn70opcq7.js"
      }
    ],
    "jsModuleRuntime": [
      {
        "name": "dotnet.runtime.uyfhwbfd13.js"
      }
    ],
    "wasmNative": [
      {
        "name": "dotnet.native.mjledzavap.wasm",
        "hash": "sha256-kl3KCioIefd3enHfxtrrGZHcFqHrgSFx2cuFa/M2WW0=",
        "cache": "force-cache"
      }
    ],
    "icu": [
      {
        "virtualPath": "icudt.dat",
        "name": "icudt.g3en5r9teb.dat",
        "hash": "sha256-5BfhzgOGQRjWj996AOsK8ZD97vgGxXD5Ucoy9h+kBH8=",
        "cache": "force-cache"
      }
    ],
    "coreAssembly": [
      {
        "payloadSize": 2643536,
        "virtualPath": "System.Private.CoreLib.wasm",
        "name": "System.Private.CoreLib.tpwmo8a2h9.wasm",
        "hash": "sha256-Iaekw8uH+zBF6Zt1lqEQGKNMUb46YoEm72MF0Lqmpnw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 44112,
        "virtualPath": "System.Runtime.InteropServices.JavaScript.wasm",
        "name": "System.Runtime.InteropServices.JavaScript.tq7sacobc9.wasm",
        "hash": "sha256-y6/F278DpLzPOYAlA+zzNlnhkMcz6xPR37DEZ+u68iE=",
        "cache": "force-cache"
      }
    ],
    "assembly": [
      {
        "payloadSize": 446544,
        "virtualPath": "AngleSharp.Css.wasm",
        "name": "AngleSharp.Css.b7abf3606t.wasm",
        "hash": "sha256-mTwDmrFSa8OjWc68tKMUDJNs3O/3LXMmcWS9ide9Z/g=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 643664,
        "virtualPath": "AngleSharp.wasm",
        "name": "AngleSharp.0csjzdgh58.wasm",
        "hash": "sha256-MK1xCUMgqroGiUZYfRmiXTZA4Rur27uuK/haXUkVssU=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 191568,
        "virtualPath": "ClosedXML.Parser.wasm",
        "name": "ClosedXML.Parser.8nvf6d98nf.wasm",
        "hash": "sha256-DAjEfDA5TxTQhreAiGB6tZ/AcEgYmlc1u9IQDY5VPf4=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 1691728,
        "virtualPath": "ClosedXML.wasm",
        "name": "ClosedXML.465gtol4a1.wasm",
        "hash": "sha256-LGv108lAwr4OIj3AIMoT1Qao70wNft7XBlH/tulWmvU=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 367696,
        "virtualPath": "DocumentFormat.OpenXml.Framework.wasm",
        "name": "DocumentFormat.OpenXml.Framework.w8i6l3p4bs.wasm",
        "hash": "sha256-4FLLFjPJlB8qV7DeO13/DChZ1rk8LWs915MScKjxhuM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4187216,
        "virtualPath": "DocumentFormat.OpenXml.wasm",
        "name": "DocumentFormat.OpenXml.jhlnzskg1d.wasm",
        "hash": "sha256-h/+xTrubybV1GVv/TiPDTZL1Lw7klulvzCTPfEWtdWQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 30288,
        "virtualPath": "ExcelNumberFormat.wasm",
        "name": "ExcelNumberFormat.2uwnvs0ix9.wasm",
        "hash": "sha256-BgtlzHk2zBHKIzFujP2j/DxKTiRcdSHn8TL2cYyS/kE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 66640,
        "virtualPath": "HtmlSanitizer.wasm",
        "name": "HtmlSanitizer.4fz57kb4p7.wasm",
        "hash": "sha256-cNb/72KE8e+HwAQmSnuDH0ulie+bM3cmDIqNOfaopfc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 315472,
        "virtualPath": "Markdig.wasm",
        "name": "Markdig.ftkhabkad2.wasm",
        "hash": "sha256-XWadihXLfe/PGSTIVyof6E73iuEeeru0wEL3kWeHZ/w=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 29776,
        "virtualPath": "Microsoft.AspNetCore.Components.Forms.wasm",
        "name": "Microsoft.AspNetCore.Components.Forms.bfh5r1a30j.wasm",
        "hash": "sha256-iRlA8I5RyqSWv1YPl5O8jp/p5ymVEc9uRrXVk/bqhu8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 106064,
        "virtualPath": "Microsoft.AspNetCore.Components.Web.wasm",
        "name": "Microsoft.AspNetCore.Components.Web.t1uwbg0v93.wasm",
        "hash": "sha256-IUtajXmhGfZzuYHCstVGgGZbrRtEHe910AntKnr9EFM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 145488,
        "virtualPath": "Microsoft.AspNetCore.Components.WebAssembly.wasm",
        "name": "Microsoft.AspNetCore.Components.WebAssembly.kh4j2k8v2v.wasm",
        "hash": "sha256-iBAqtQ9taeuBUu47roR5pnIORQvl0r8VAbiDLhiZB5o=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 302160,
        "virtualPath": "Microsoft.AspNetCore.Components.wasm",
        "name": "Microsoft.AspNetCore.Components.y14s1xrnqe.wasm",
        "hash": "sha256-esdi5K/hetvKlApXMli5XH6e5tKwlRqlOw9cSFAMfVE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 10832,
        "virtualPath": "Microsoft.AspNetCore.WebUtilities.wasm",
        "name": "Microsoft.AspNetCore.WebUtilities.2h3gobln2d.wasm",
        "hash": "sha256-lqkB0A+R9y59n3N4oD6Ywf4kn4z3c6fIThaf7jhmuaU=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 7087696,
        "virtualPath": "Microsoft.CodeAnalysis.CSharp.wasm",
        "name": "Microsoft.CodeAnalysis.CSharp.i7ts7ks919.wasm",
        "hash": "sha256-Ikb4IYzN1/b97Tht23uKNwU/DaJtwllXo+xx5wYv8dA=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 3100752,
        "virtualPath": "Microsoft.CodeAnalysis.wasm",
        "name": "Microsoft.CodeAnalysis.5czhi9mo1u.wasm",
        "hash": "sha256-JUNkAo365JBQQ0sdAYD/+CmloSIxJkzKiK52SY4lijs=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 6224,
        "virtualPath": "Microsoft.Extensions.Configuration.Abstractions.wasm",
        "name": "Microsoft.Extensions.Configuration.Abstractions.gol3euaj3d.wasm",
        "hash": "sha256-gPYEp70ZmrxYlpLQw7hcxdmIbQ6vmluxLP8cfyoVWzo=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 12880,
        "virtualPath": "Microsoft.Extensions.Configuration.EnvironmentVariables.wasm",
        "name": "Microsoft.Extensions.Configuration.EnvironmentVariables.vaqacjgd1g.wasm",
        "hash": "sha256-WWSvU1JDlu+bkUC9QASXcgI6FBxn6nqhoi+goYlADAM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 9808,
        "virtualPath": "Microsoft.Extensions.Configuration.Json.wasm",
        "name": "Microsoft.Extensions.Configuration.Json.q81lkglnox.wasm",
        "hash": "sha256-it2ZhBMdA01nWq87yJoqpIh2zzD4VlW5qVKw+RKqPzw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 8784,
        "virtualPath": "Microsoft.Extensions.Configuration.wasm",
        "name": "Microsoft.Extensions.Configuration.e6rfa9mvfw.wasm",
        "hash": "sha256-qprAZs11QknnNWs31jrjGmWxdUsXL6dZqWOH/WHzx8s=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 26704,
        "virtualPath": "Microsoft.Extensions.DependencyInjection.Abstractions.wasm",
        "name": "Microsoft.Extensions.DependencyInjection.Abstractions.00btl6kpwm.wasm",
        "hash": "sha256-8Gl4zLvWURZm4U7mVSWm8qN4poXZWNK1NXg5/NEGoSk=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 54864,
        "virtualPath": "Microsoft.Extensions.DependencyInjection.wasm",
        "name": "Microsoft.Extensions.DependencyInjection.nyfzzvsl5t.wasm",
        "hash": "sha256-jxo+s2tQ1ttnsvHv0GfKvqHrm+o+J/1F+8wsAPpKK20=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 8272,
        "virtualPath": "Microsoft.Extensions.Diagnostics.Abstractions.wasm",
        "name": "Microsoft.Extensions.Diagnostics.Abstractions.qz20gv1zfo.wasm",
        "hash": "sha256-2jQ7jiew9q+5Ke8i4fl+RClN1kk9u0ejlFTCHyIWg4Q=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 14928,
        "virtualPath": "Microsoft.Extensions.Diagnostics.wasm",
        "name": "Microsoft.Extensions.Diagnostics.es1aeztafo.wasm",
        "hash": "sha256-jrG0mdpst0h6GpNSYnKL6CGIpoqljOAai75Nx5vueow=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5200,
        "virtualPath": "Microsoft.Extensions.Hosting.Abstractions.wasm",
        "name": "Microsoft.Extensions.Hosting.Abstractions.wgrd77yf8o.wasm",
        "hash": "sha256-UI/VpVCSQq1k6851I2nIRybFHWT0BJkz8pnAhtB+6fs=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 28240,
        "virtualPath": "Microsoft.Extensions.Logging.Abstractions.wasm",
        "name": "Microsoft.Extensions.Logging.Abstractions.ndqd6y4475.wasm",
        "hash": "sha256-NWvCnZePj4rXoxVRu/WaBZJgbknKn/Jn6NQHVjzojC8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 17488,
        "virtualPath": "Microsoft.Extensions.Logging.wasm",
        "name": "Microsoft.Extensions.Logging.ksbw1ccply.wasm",
        "hash": "sha256-TKvpCqOYjJqprbYn0eluY84Nj1RMWjYf/0zCA25CcB0=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 26704,
        "virtualPath": "Microsoft.Extensions.Options.wasm",
        "name": "Microsoft.Extensions.Options.nvltry3500.wasm",
        "hash": "sha256-A0dXiHpr0hMGvUujN7Ot5KwERUypRjBkfqfN9mxMiSY=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 16976,
        "virtualPath": "Microsoft.Extensions.Primitives.wasm",
        "name": "Microsoft.Extensions.Primitives.20vvkr0ibt.wasm",
        "hash": "sha256-TvFpBLWpIm6Omxe4slFYXd8+dtUtM6WuKgVw73Yt3No=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 11856,
        "virtualPath": "Microsoft.JSInterop.WebAssembly.wasm",
        "name": "Microsoft.JSInterop.WebAssembly.kthmj8ue8z.wasm",
        "hash": "sha256-uHbb5b7vnE0GwS6Qws3ipDRp2E0UWNZ9G2JJrz8Au4U=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 50256,
        "virtualPath": "Microsoft.JSInterop.wasm",
        "name": "Microsoft.JSInterop.u4efrs2md5.wasm",
        "hash": "sha256-sn9+fOIyOUaHFsDHRZbqVk4ZtGWn47FrmnEYwdqDuxw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 34384,
        "virtualPath": "RBush.wasm",
        "name": "RBush.tuoy6pi7g8.wasm",
        "hash": "sha256-q6MgO4b7Lzus+LAAyXLvA7a8u3/EPEbNo9Rn/Ix2hys=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 1135184,
        "virtualPath": "SixLabors.Fonts.wasm",
        "name": "SixLabors.Fonts.iz63g7x2l2.wasm",
        "hash": "sha256-HmLhPukFj5F8bm1AIkORPaRFFPIIZaKmaXY52rtb1Ds=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4176,
        "virtualPath": "System.Buffers.wasm",
        "name": "System.Buffers.xpkgrof6q3.wasm",
        "hash": "sha256-G2hDV+aMcb2IPAi4V7SMFKiyZsv4Nb6PdGQn0+bWxq8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 10320,
        "virtualPath": "System.Collections.Concurrent.wasm",
        "name": "System.Collections.Concurrent.17x4z4eofa.wasm",
        "hash": "sha256-DfROPYLa6SpotIYAT/2kbUvs1zjWKJpWAimcpnVum7I=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 167504,
        "virtualPath": "System.Collections.Immutable.wasm",
        "name": "System.Collections.Immutable.rno72f66m2.wasm",
        "hash": "sha256-aclZ5GAE4qHBR2aOpPvqvjNSndL6vuZUabo56BUNqnw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 8272,
        "virtualPath": "System.Collections.NonGeneric.wasm",
        "name": "System.Collections.NonGeneric.ag9nzj9s85.wasm",
        "hash": "sha256-ZrHBSj7OWteTvibbyvQpgzGJrXuItKHnzcmE729Eaq4=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 10320,
        "virtualPath": "System.Collections.Specialized.wasm",
        "name": "System.Collections.Specialized.5g02cl9ce7.wasm",
        "hash": "sha256-xf7QCGb6i5Ys2OB9XJkJhbkmbP0kquqzqk+Br2LZfkM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 71248,
        "virtualPath": "System.Collections.wasm",
        "name": "System.Collections.pnax4ojpkh.wasm",
        "hash": "sha256-NQg4lr+AhhdKASxVrqmso0EJCkeOSenajBTBREpmmWU=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5712,
        "virtualPath": "System.ComponentModel.Annotations.wasm",
        "name": "System.ComponentModel.Annotations.7pexq6xyf6.wasm",
        "hash": "sha256-VXUBpq9ynk6Q1XBRPOORNNQZTssP6IZTcBkM/LCE1h4=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 11856,
        "virtualPath": "System.ComponentModel.Primitives.wasm",
        "name": "System.ComponentModel.Primitives.46v7pj1m4m.wasm",
        "hash": "sha256-dPG6URMpovCHKvYlpg41EJycXWuYzfY43F4JqH7HcpE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 101968,
        "virtualPath": "System.ComponentModel.TypeConverter.wasm",
        "name": "System.ComponentModel.TypeConverter.xxr2y651vs.wasm",
        "hash": "sha256-9cNxmLeKcfYrjcqH7MPhcmrHI0dSazNvNalCcK0HAxc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5200,
        "virtualPath": "System.ComponentModel.wasm",
        "name": "System.ComponentModel.9zlsy5d2h3.wasm",
        "hash": "sha256-RUQeRGCBHDRIWqcynlfDU7ykuGnxRTXruxvWFbvkHcQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 14928,
        "virtualPath": "System.Console.wasm",
        "name": "System.Console.thqg51scj4.wasm",
        "hash": "sha256-34wFxQAbcNmqDOxzFjnv/9yhQKk4cgR3zbIGAt2zURQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 272976,
        "virtualPath": "System.Data.Common.wasm",
        "name": "System.Data.Common.lyg2w4bz03.wasm",
        "hash": "sha256-XeKEFSQ9ckYeVhRlFpy1yGbx2IKD4hlzoFmTSwIslvs=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Diagnostics.Debug.wasm",
        "name": "System.Diagnostics.Debug.jkb0e5zjep.wasm",
        "hash": "sha256-bdPDOnY69S3g3+twXlQqod17CiJdTXZYvwsIraIAloM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 154704,
        "virtualPath": "System.Diagnostics.DiagnosticSource.wasm",
        "name": "System.Diagnostics.DiagnosticSource.9583i1rh69.wasm",
        "hash": "sha256-A85SDGEWloOiVUXQE++vOwbl4zFrvb45myhFacYI8V4=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Diagnostics.StackTrace.wasm",
        "name": "System.Diagnostics.StackTrace.rkf9e1cwbi.wasm",
        "hash": "sha256-5RZ4rDGUsd3D7EPRSsuB6zOFIsk3xu5EOvpd4kbqtnE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Diagnostics.Tools.wasm",
        "name": "System.Diagnostics.Tools.x10a2axpom.wasm",
        "hash": "sha256-xRiaRYAd9/d1DhPeTFtHdyTp1yp6H3LVFf13Fbnx7OI=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Diagnostics.Tracing.wasm",
        "name": "System.Diagnostics.Tracing.tiwhahe39e.wasm",
        "hash": "sha256-G3M/icgpTx/yVsrH9thvjGNUXsTUeOHzhqj9DHFpR34=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 36944,
        "virtualPath": "System.Drawing.Primitives.wasm",
        "name": "System.Drawing.Primitives.jxppkasuam.wasm",
        "hash": "sha256-h4sQpsKCto5SCcgkJUWAmHCgVu89uwD3YEifkve6GSE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Drawing.wasm",
        "name": "System.Drawing.v57mcc1hsz.wasm",
        "hash": "sha256-PabjD65L8n7SF1ZriVDRC6ty3AlK4AXSExdLyfUItxY=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 6224,
        "virtualPath": "System.IO.Compression.Brotli.wasm",
        "name": "System.IO.Compression.Brotli.jrmzx8j8ed.wasm",
        "hash": "sha256-AZGBCUmreH7ArQGgcbUG+e36Exvc7RWJu9LzfROjFtI=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 136784,
        "virtualPath": "System.IO.Compression.wasm",
        "name": "System.IO.Compression.8r9920es9x.wasm",
        "hash": "sha256-pLuYW5FkrPh7oTal9cAtwDYVQSKdi5iURaaYFfdQiN8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.IO.FileSystem.wasm",
        "name": "System.IO.FileSystem.hmsopzo2ge.wasm",
        "hash": "sha256-6csU3lr+QC1Wmi25a8iga+2Fi+u3sMkn7oF/eJDAE8E=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 24656,
        "virtualPath": "System.IO.MemoryMappedFiles.wasm",
        "name": "System.IO.MemoryMappedFiles.xlomxg9e9a.wasm",
        "hash": "sha256-68gHt6N6c86ZodhE1ulgxi9oCjgLRiqcznnlHAJcPzc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 86608,
        "virtualPath": "System.IO.Packaging.wasm",
        "name": "System.IO.Packaging.wt6t7djkcf.wasm",
        "hash": "sha256-LE1qcJtSKOOJ6Y+k3ImEX+XOnLR279/81k2j+3KIhb0=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5712,
        "virtualPath": "System.IO.Pipelines.wasm",
        "name": "System.IO.Pipelines.yeihgeljvz.wasm",
        "hash": "sha256-hnDOQNTIH/aa1TzCygGWtOIjPNT7her4x77kuTUV3To=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 371792,
        "virtualPath": "System.Linq.Expressions.wasm",
        "name": "System.Linq.Expressions.tkzpktrrqk.wasm",
        "hash": "sha256-o+f2goAk1DjY4mEMGfDdQ67zO341BJGKYWrXv2lvpZ8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 7248,
        "virtualPath": "System.Linq.Parallel.wasm",
        "name": "System.Linq.Parallel.cwsr8zcrni.wasm",
        "hash": "sha256-9ECmSs1qB6Som+oBb1gwxN5O1kK5M3CjAf3sO2WsxJc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 99920,
        "virtualPath": "System.Linq.wasm",
        "name": "System.Linq.3rdps0uaos.wasm",
        "hash": "sha256-IfIlAOVVXp++vOvH2CfMo83asJ1S6T0S5+uvaXrLwpM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 14928,
        "virtualPath": "System.Memory.wasm",
        "name": "System.Memory.hr2i0wt0c1.wasm",
        "hash": "sha256-g9H5xDFIhgv9ekyB+Et9H3PZKfIBLjZVfBArgyf3S+A=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 176208,
        "virtualPath": "System.Net.Http.wasm",
        "name": "System.Net.Http.kzioj8q2zp.wasm",
        "hash": "sha256-IKkYu8d3bF1tjHkhhm6kd0zybbrepMbVyEhQChod7DE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 27728,
        "virtualPath": "System.Net.Primitives.wasm",
        "name": "System.Net.Primitives.jxa15obljm.wasm",
        "hash": "sha256-aZ2zunDcMgO5NV1UDze33cj39nO4GshPj1Xu/5uDUOM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Numerics.Vectors.wasm",
        "name": "System.Numerics.Vectors.x92n761s8l.wasm",
        "hash": "sha256-u0Wy1mZTNlLNB0APmEXoQNN8cBpWzc3ocLXLNVf7Vyc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 12368,
        "virtualPath": "System.ObjectModel.wasm",
        "name": "System.ObjectModel.bsnncfhwxq.wasm",
        "hash": "sha256-KxBV1yFcCJlrJlCb2gUCmM3Q0MGnfw+wTeqppDh4uk0=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 71248,
        "virtualPath": "System.Private.Uri.wasm",
        "name": "System.Private.Uri.ca1ehx8yom.wasm",
        "hash": "sha256-BNO5nUkIBEwgRuQJ+V3KDXrx/J1VdAjkpxFFRMJJ5Cw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 53328,
        "virtualPath": "System.Private.Xml.Linq.wasm",
        "name": "System.Private.Xml.Linq.14lmcho3sp.wasm",
        "hash": "sha256-nzvzSTTwnZyg3HgSBV9UzzPtkBCuLPUZhWt5Vrytoo8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 637008,
        "virtualPath": "System.Private.Xml.wasm",
        "name": "System.Private.Xml.it0ots7ny0.wasm",
        "hash": "sha256-2ogqS51t+oLbF4dBCWs5GJylqRkqoM3+/8I4eG4AUlQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 279120,
        "virtualPath": "System.Reflection.Metadata.wasm",
        "name": "System.Reflection.Metadata.7adbum9m6p.wasm",
        "hash": "sha256-/x2+2F/O6785FzndDA2KE+oQNRe/U54NQJ44oY8EqKA=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Reflection.Primitives.wasm",
        "name": "System.Reflection.Primitives.i9ve0m5vb4.wasm",
        "hash": "sha256-xr1EY/5g8Pc61bsqErCytffyRvanf62u18ga8RNFMw8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Resources.ResourceManager.wasm",
        "name": "System.Resources.ResourceManager.mnfhtsq9ra.wasm",
        "hash": "sha256-fokHw+uEY3rt60aYSbqOyfu1UPqqs0XpAY5iRgFSx20=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Runtime.CompilerServices.Unsafe.wasm",
        "name": "System.Runtime.CompilerServices.Unsafe.hivufs773i.wasm",
        "hash": "sha256-CYqYj5R5y3wp43wJMQhAbTf3Ecl3iCe+2TCSvB6LYlQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Runtime.Extensions.wasm",
        "name": "System.Runtime.Extensions.dxwfp61vbc.wasm",
        "hash": "sha256-j0ogaWb5QPjzP8Ktt6ZaxaYqtxXCMHEdPlGOwX38aoQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Runtime.InteropServices.RuntimeInformation.wasm",
        "name": "System.Runtime.InteropServices.RuntimeInformation.s4lfg6ytlz.wasm",
        "hash": "sha256-RJ/MMQ6Nm3WSOah+LLmpwk4bz3sgAOG6szhhAmhm784=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5200,
        "virtualPath": "System.Runtime.InteropServices.wasm",
        "name": "System.Runtime.InteropServices.9qbzu8e9tk.wasm",
        "hash": "sha256-37tgwIMW0a2RkujVztGS79vi9h6P/mA2V+awmRqPAeY=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Runtime.Intrinsics.wasm",
        "name": "System.Runtime.Intrinsics.yzudcvq0x0.wasm",
        "hash": "sha256-LubPN6Zp4c0lSi7NuuyHtKyfoP9sJul94qJDVndFzJc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Runtime.Loader.wasm",
        "name": "System.Runtime.Loader.ki0bukwqji.wasm",
        "hash": "sha256-pPoiFKCUbuSdAC9zQxHpi0/SK3Akww5ZQrdChuNK60M=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 128592,
        "virtualPath": "System.Runtime.Numerics.wasm",
        "name": "System.Runtime.Numerics.6sb9n082w5.wasm",
        "hash": "sha256-GuXiwyzAJur7UT7axoqFyBFm9bQVqBT/4C6/vSVfd4g=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5712,
        "virtualPath": "System.Runtime.Serialization.Primitives.wasm",
        "name": "System.Runtime.Serialization.Primitives.8h9alc11vr.wasm",
        "hash": "sha256-hHx2zm0IAn+XrpK9nTO2oX1fHEL8gtnXJFdvxJGKGSQ=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 15440,
        "virtualPath": "System.Runtime.wasm",
        "name": "System.Runtime.lac972nskq.wasm",
        "hash": "sha256-fcUEAKTUlOBRNrm+gtm1ZD3sWIecvDV9UPT1nEv/R00=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 28752,
        "virtualPath": "System.Security.Cryptography.wasm",
        "name": "System.Security.Cryptography.tx6tpl0rx7.wasm",
        "hash": "sha256-n0rtkNgudTr67VhWeiTdkep4B8AA4Fe1MaZsIUCVz2E=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 698960,
        "virtualPath": "System.Text.Encoding.CodePages.wasm",
        "name": "System.Text.Encoding.CodePages.7ov3s9oh4w.wasm",
        "hash": "sha256-6RwA5coq2rnDB/hdsYT8HKsmm9KgXZ/KkFmpmWDKcto=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Text.Encoding.Extensions.wasm",
        "name": "System.Text.Encoding.Extensions.bun8gqptxl.wasm",
        "hash": "sha256-s7LPtG643q5Q6zfHk8sRvgIHjgWc0fBYayJZutqgmnE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 30800,
        "virtualPath": "System.Text.Encodings.Web.wasm",
        "name": "System.Text.Encodings.Web.jc3chyc61e.wasm",
        "hash": "sha256-DatGrFfThj3Fn/rmSThtHRZNRAN4TUa/ir09FNHA9NE=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 452688,
        "virtualPath": "System.Text.Json.wasm",
        "name": "System.Text.Json.in3wuxmzll.wasm",
        "hash": "sha256-fvytPSTcxUtL62W1UEf6qmvCG5LW0tvT2Kb/V74tTuo=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 266832,
        "virtualPath": "System.Text.RegularExpressions.wasm",
        "name": "System.Text.RegularExpressions.huan2lmc34.wasm",
        "hash": "sha256-qaz86zDz9IptQL950txGK53He9H2XZKGdt9FmU9SFzw=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 19024,
        "virtualPath": "System.Threading.Tasks.Parallel.wasm",
        "name": "System.Threading.Tasks.Parallel.fc9c58kf4x.wasm",
        "hash": "sha256-sQDnVvbn+JT7dEyDaULf+j0adzdOgOnDd3oP0PdW0fk=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 5200,
        "virtualPath": "System.Threading.wasm",
        "name": "System.Threading.k1snddr18n.wasm",
        "hash": "sha256-uF7xpka2MJ8QfApXVdhSpNvs8CaFcw5pkltBFebvJDc=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4176,
        "virtualPath": "System.Xml.Linq.wasm",
        "name": "System.Xml.Linq.6jrwceho2h.wasm",
        "hash": "sha256-Yue7a3j8L0A300dI+FSbE9aWjzz0C7n1n3cYfwSb/as=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Xml.ReaderWriter.wasm",
        "name": "System.Xml.ReaderWriter.os4v29kr4m.wasm",
        "hash": "sha256-CDDDREpa0XZFuWq6IgEr1HJaJZ/HGmaAa1AVpEq3MtI=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Xml.XDocument.wasm",
        "name": "System.Xml.XDocument.zk0tbcsdm1.wasm",
        "hash": "sha256-M0O3aa7YFndkkhXoVXHsZRyCEwmIPotD7ECgZw63ipU=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.Xml.XPath.XDocument.wasm",
        "name": "System.Xml.XPath.XDocument.bak4vdvpf4.wasm",
        "hash": "sha256-s0IOKzz8wB8dd9hr4VpAcWz6wEofK7IYybzrNlT/br8=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 4688,
        "virtualPath": "System.wasm",
        "name": "System.n1lgwvdeih.wasm",
        "hash": "sha256-deV0DUTbY0DlBTfQncbI/Sg+Eb7dON2nXbyolKeyvTM=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 1472592,
        "virtualPath": "Tavenem.Blazor.Framework.DocPages.wasm",
        "name": "Tavenem.Blazor.Framework.DocPages.2ubvoef302.wasm",
        "hash": "sha256-VvKYfnZb7/DTB1GW1/5qY4GIssPIJnGL+XznrC7QkL4=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 11856,
        "virtualPath": "Tavenem.Blazor.Framework.Docs.wasm",
        "name": "Tavenem.Blazor.Framework.Docs.lqjs44i8gw.wasm",
        "hash": "sha256-E3nJ5sIsV0OUt7Sre9p5MY6IAXt4dV7pTQpq0fortHs=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 831568,
        "virtualPath": "Tavenem.Blazor.Framework.wasm",
        "name": "Tavenem.Blazor.Framework.iip1way2zg.wasm",
        "hash": "sha256-al/P1IRMVss7jSt6ANV+dIc6LlhV2i+CfImKDfwlS5o=",
        "cache": "force-cache"
      },
      {
        "payloadSize": 12368,
        "virtualPath": "netstandard.wasm",
        "name": "netstandard.klyw03wd3d.wasm",
        "hash": "sha256-KKMpG56D5/Q1xIZxCyCtspS/YM+wUKdmTNUwf+qUj7I=",
        "cache": "force-cache"
      }
    ],
    "satelliteResources": {
      "cs": [
        {
          "payloadSize": 443984,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.55ztg55066.wasm",
          "hash": "sha256-Keu9JfJJEdBbSgNf87nE8cuCbtlyDcAqh/lfhZLxAd4=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 30800,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.ys34kbdoin.wasm",
          "hash": "sha256-QlwgJXHsJ3xCHe9KpaDp48l+Lw9cnKwy0XEtmC7Eb10=",
          "cache": "force-cache"
        }
      ],
      "de": [
        {
          "payloadSize": 476240,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.2n7hcuq4us.wasm",
          "hash": "sha256-ElsiC6BUCQbDkbhpOLYWAPt9C89i/laB+xW7q/ptGj8=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 32336,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.lze62l0cbc.wasm",
          "hash": "sha256-YUfdJWuuFctKetRIqjpU15yLVqPI7+D1b4da0+ElUto=",
          "cache": "force-cache"
        }
      ],
      "es": [
        {
          "payloadSize": 465488,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.qltrgpsvbd.wasm",
          "hash": "sha256-nmJWYTEYW9xt3T3d0hxLJwUYYD/rf2S06+c8hpbTPUY=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 31824,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.n84jh10tim.wasm",
          "hash": "sha256-yc7Md3gVtteKYlnmqliLOZFn43ZJYXn3Eb79TnFd0gk=",
          "cache": "force-cache"
        }
      ],
      "fr": [
        {
          "payloadSize": 479312,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.lfs1ak4dbl.wasm",
          "hash": "sha256-MeAKDBqLBK5SoNb3RVW7QMI+Hteb2SB5gA6PqkTs0Jc=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 32336,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.g8j10lkewk.wasm",
          "hash": "sha256-oEt18vKU5NYY3C16RzLebegVTiw7aeAkvirbntTCne4=",
          "cache": "force-cache"
        }
      ],
      "it": [
        {
          "payloadSize": 471632,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.k7yru4jmr9.wasm",
          "hash": "sha256-8ANmG3ImkDd0NUZaneM0M91lutWYIq5lM2zNrzU/0Y4=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 32336,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.3vdbmx3ly8.wasm",
          "hash": "sha256-EXsaYrthbILQ5e8cgSyCvzl9BVi0rdkQKU/m2OP1pMY=",
          "cache": "force-cache"
        }
      ],
      "ja": [
        {
          "payloadSize": 521296,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.lu4elm0i7h.wasm",
          "hash": "sha256-Dd15NZrsfn1nCZgpeA6hB1U1sX9s5kM2nCUvWt1tFto=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 34896,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.9ucyc012s6.wasm",
          "hash": "sha256-f270CNToKWrlLCtBuLS50hBD/VrTYALn9b6ERwZE9+4=",
          "cache": "force-cache"
        }
      ],
      "ko": [
        {
          "payloadSize": 476752,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.kw5wmvql62.wasm",
          "hash": "sha256-HIjKLUIaV7+CAg0InbI4CInfFiJd1LM1x/31KknMGJA=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 32336,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.hxep9qmlx7.wasm",
          "hash": "sha256-1QiB2sIP8L04JGaClErKO8rwdQdfhC6IG9/+KDd+EI4=",
          "cache": "force-cache"
        }
      ],
      "pl": [
        {
          "payloadSize": 478288,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.ljd6e6d6vj.wasm",
          "hash": "sha256-73/gizLmGU/l2bWbxACbSDD1O/rub1fPJrh/pXhOeWA=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 32336,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.wxmwafus6z.wasm",
          "hash": "sha256-JALMMTbV9D9/Q3dcUXCCD8T6/JkphO6qrhN3C6d2oRY=",
          "cache": "force-cache"
        }
      ],
      "pt-BR": [
        {
          "payloadSize": 456784,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.jbj41d7501.wasm",
          "hash": "sha256-z9+LRxxpBAhfEI44c22djg1b9V3BEtnxO+qA9p6v3Do=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 31312,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.7hbyh7n94u.wasm",
          "hash": "sha256-m0v9UEakMX8kXsyLwmEnu3BCkO6EzSDrewwo34rjMFA=",
          "cache": "force-cache"
        }
      ],
      "ru": [
        {
          "payloadSize": 631376,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.ezznxkfxxp.wasm",
          "hash": "sha256-Finv77DI/kKCP9jR6vFrECIpnWqCVXKwThxviTtY55c=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 41040,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.w7ddjnjosw.wasm",
          "hash": "sha256-1JyaijHdn+qh3xvFxfVXpN4eYLMr8ugl4Y4BxqgLiUA=",
          "cache": "force-cache"
        }
      ],
      "tr": [
        {
          "payloadSize": 452688,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.kl518e3kpl.wasm",
          "hash": "sha256-aP2l7/BAKHeh/pYHFQ5gx5FXEs4awjBY+Q3/VJyGNIw=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 30800,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.wz8qjfddka.wasm",
          "hash": "sha256-9LANOFSPi2XGL+zg2vtN+iv8kFzER8ylOROiADjNgFw=",
          "cache": "force-cache"
        }
      ],
      "zh-Hans": [
        {
          "payloadSize": 401488,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.bi1zn68n6x.wasm",
          "hash": "sha256-Y4GAt4yF17NEO3jzQAs0dyEJ5nXk28KW1v7n0Nj2E20=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 28240,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.c9rq71pi0k.wasm",
          "hash": "sha256-gCdKMBFoe9AMj3EkZ/e7rQMOsnZdjufZOhfruRuXAUs=",
          "cache": "force-cache"
        }
      ],
      "zh-Hant": [
        {
          "payloadSize": 400976,
          "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.wasm",
          "name": "Microsoft.CodeAnalysis.CSharp.resources.oiv90e6y7z.wasm",
          "hash": "sha256-0N/dyFgs3WJWZabvRCSocIq/AarpakC8YSkzYsmN5qc=",
          "cache": "force-cache"
        },
        {
          "payloadSize": 28240,
          "virtualPath": "Microsoft.CodeAnalysis.resources.wasm",
          "name": "Microsoft.CodeAnalysis.resources.gva385kdfh.wasm",
          "hash": "sha256-zBX+ydytiIQ39+sGpzVVHt14hbEyEeVSTPCqyyi8fVM=",
          "cache": "force-cache"
        }
      ]
    },
    "libraryInitializers": [
      {
        "name": "_content/Tavenem.Blazor.Framework/Tavenem.Blazor.Framework.byvz4ixj33.lib.module.js"
      }
    ],
    "modulesAfterConfigLoaded": [
      {
        "name": "../_content/Tavenem.Blazor.Framework/Tavenem.Blazor.Framework.byvz4ixj33.lib.module.js"
      }
    ]
  },
  "debugLevel": 0,
  "globalizationMode": "all",
  "extensions": {
    "blazor": {}
  },
  "runtimeConfig": {
    "runtimeOptions": {
      "configProperties": {
        "Microsoft.AspNetCore.Components.Routing.RegexConstraintSupport": false,
        "Microsoft.Extensions.DependencyInjection.VerifyOpenGenericServiceTrimmability": true,
        "System.ComponentModel.DefaultValueAttribute.IsSupported": false,
        "System.ComponentModel.Design.IDesignerHost.IsSupported": false,
        "System.ComponentModel.TypeConverter.EnableUnsafeBinaryFormatterInDesigntimeLicenseContextSerialization": false,
        "System.ComponentModel.TypeDescriptor.IsComObjectDescriptorSupported": false,
        "System.Data.DataSet.XmlSerializationIsSupported": false,
        "System.Diagnostics.Debugger.IsSupported": false,
        "System.Diagnostics.Metrics.Meter.IsSupported": true,
        "System.Diagnostics.Tracing.EventSource.IsSupported": true,
        "System.GC.Server": true,
        "System.Globalization.Invariant": false,
        "System.TimeZoneInfo.Invariant": false,
        "System.Linq.Enumerable.IsSizeOptimized": true,
        "System.Net.Http.EnableActivityPropagation": true,
        "System.Net.Http.WasmEnableStreamingResponse": true,
        "System.Net.SocketsHttpHandler.Http3Support": false,
        "System.Reflection.Metadata.MetadataUpdater.IsSupported": false,
        "System.Resources.ResourceManager.AllowCustomResourceTypes": false,
        "System.Resources.UseSystemResourceKeys": true,
        "System.Runtime.CompilerServices.RuntimeFeature.IsDynamicCodeSupported": true,
        "System.Runtime.InteropServices.BuiltInComInterop.IsSupported": false,
        "System.Runtime.InteropServices.EnableConsumingManagedCodeFromNativeHosting": false,
        "System.Runtime.InteropServices.EnableCppCLIHostActivation": false,
        "System.Runtime.InteropServices.Marshalling.EnableGeneratedComInterfaceComImportInterop": false,
        "System.Runtime.Serialization.EnableUnsafeBinaryFormatterSerialization": false,
        "System.StartupHookProvider.IsSupported": false,
        "System.Text.Encoding.EnableUnsafeUTF7Encoding": false,
        "System.Text.Json.JsonSerializer.IsReflectionEnabledByDefault": true,
        "System.Threading.Thread.EnableAutoreleasePool": false,
        "Microsoft.AspNetCore.Components.Endpoints.NavigationManager.DisableThrowNavigationException": false,
        "System.Diagnostics.StackTrace.IsLineNumberSupported": false,
        "System.Runtime.CompilerServices.RuntimeFeature.IsMultithreadingSupported": false
      }
    }
  }
}/*json-end*/);export{po as default,mo as dotnet,go as exit};
