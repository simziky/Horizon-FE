"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-6">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

// "use client";

// import * as Sentry from "@sentry/nextjs";
// import NextError from "next/error";
// import { useEffect } from "react";

// export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
//   useEffect(() => {
//     Sentry.captureException(error);
//   }, [error]);

//   return (
//     <html>
//       <body>
//         {/* `NextError` is the default Next.js error page component. Its type
//         definition requires a `statusCode` prop. However, since the App Router
//         does not expose status codes for errors, we simply pass 0 to render a
//         generic error message. */}
//         <NextError statusCode={0} />
//       </body>
//     </html>
//   );
// }
