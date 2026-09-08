/** Shown when an invite token does not match any enrollment. */
export default function InvalidLink() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
        !
      </div>
      <h1 className="mb-2 text-lg font-bold text-slate-900">
        This link is invalid or has expired
      </h1>
      <p className="text-sm text-slate-600">
        Please contact your administrator to request a new invitation link.
      </p>
    </div>
  );
}
