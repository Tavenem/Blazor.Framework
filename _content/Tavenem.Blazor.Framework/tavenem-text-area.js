function s(e,t){let n=document.getElementById(e);n&&n.addEventListener("keydown",r.bind(t))}function r(e){if(e.key==="Enter"&&!e.shiftKey)return(e.currentTarget?.hasAttribute("suppressEnter")??!1)&&(e.preventDefault(),e.stopPropagation()),e.currentTarget?.blur(),this.invokeMethodAsync("OnEnterAsync")}export{s as init};
//# sourceMappingURL=tavenem-text-area.js.map
