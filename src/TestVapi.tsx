import { useEffect, useMemo } from "react";
import Vapi, * as VapiNS from "@vapi-ai/web";

export default function TestVapi() {
  const shapes = useMemo(() => {
    try {
      const keys = Object.keys(VapiNS || {});
      const hasCreateWidget = typeof (VapiNS as any)?.createWidget === 'function';
      const defaultType = typeof Vapi;
      return { keys, hasCreateWidget, defaultType };
    } catch (e) {
      return { keys: [], hasCreateWidget: false, defaultType: 'unknown' };
    }
  }, []);

  useEffect(() => {
    console.log("[@vapi-ai/web] default export:", Vapi);
    console.log("[@vapi-ai/web] namespace keys:", Object.keys(VapiNS || {}));
    console.log("has createWidget:", typeof (VapiNS as any)?.createWidget === 'function');
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Vapi SDK Debug</h2>
      <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
        {JSON.stringify(shapes, null, 2)}
      </pre>
      <p>Open the console to inspect the exports.</p>
    </div>
  );
}

