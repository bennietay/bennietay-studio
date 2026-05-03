/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert } from "lucide-react";

export function LegalDisclaimer() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 text-slate-600 dark:text-slate-400 my-8">
      <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <div className="text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">
            System Owner Protection & Disclosure
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-medium text-indigo-600 uppercase tracking-tighter">
            Legal Policy v2.4
          </span>
        </div>
        <p>
          Bennie Tay Studio ("Platform Owner") provides AI-powered business
          synthesis tools for general empowerment. By using this system, you
          expressly acknowledge that all AI-generated outputs (including but not limited to content, code, marketing strategies, and functional layouts) are
          non-verified probabilistic drafts. These outputs are provided strictly for informational purposes and **require mandatory, expert human review** before
          any professional, commercial, or public application.
        </p>
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          MAXIMUM LIABILITY PROTECTION: Platform Owner disclaims all liability for business interruptions, financial losses, regulatory non-compliance, or data inaccuracies resulting from system usage. By proceeding, you agree to assume all risk and indemnify the Platform Owner against any and all claims arising from digital assets synthesized, hosted, or published via this infrastructure.
        </p>
      </div>
    </div>
  );
}
