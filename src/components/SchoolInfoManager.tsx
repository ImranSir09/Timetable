import { SchoolProfile } from '../types';
import { Building2, FileCheck, MapPin, Hash, Calendar, Shield } from 'lucide-react';

interface SchoolInfoManagerProps {
  profile: SchoolProfile;
  onChangeProfile: (updated: Partial<SchoolProfile>) => void;
}

export default function SchoolInfoManager({
  profile,
  onChangeProfile,
}: SchoolInfoManagerProps) {
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
          School & Office Details
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          These details are formatted in the official government letterhead and signatures on the A4 landscape export.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-4 space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" /> Institution Name *
          </label>
          <input
            type="text"
            value={profile.schoolName}
            onChange={(e) => onChangeProfile({ schoolName: e.target.value })}
            placeholder="e.g. GOVT. MIDDLE SCHOOL"
            className="w-full px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-500" /> Office Header
          </label>
          <input
            type="text"
            value={profile.officeTitle}
            onChange={(e) => onChangeProfile({ officeTitle: e.target.value })}
            placeholder="e.g. OFFICE OF THE HEADMASTER"
            className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Academic Session
            </label>
            <input
              type="text"
              value={profile.session}
              onChange={(e) => onChangeProfile({ session: e.target.value })}
              placeholder="e.g. 2026-2027"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-500" /> U-DISE Code
            </label>
            <input
              type="text"
              value={profile.uDiseCode}
              onChange={(e) => onChangeProfile({ uDiseCode: e.target.value })}
              placeholder="e.g. 01234567890"
              className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" /> District
            </label>
            <input
              type="text"
              value={profile.district}
              onChange={(e) => onChangeProfile({ district: e.target.value })}
              placeholder="e.g. Anantnag"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" /> Zone
            </label>
            <input
              type="text"
              value={profile.zone}
              onChange={(e) => onChangeProfile({ zone: e.target.value })}
              placeholder="e.g. Zone Bidder"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" /> Address / Location
          </label>
          <input
            type="text"
            value={profile.address}
            onChange={(e) => onChangeProfile({ address: e.target.value })}
            placeholder="e.g. Main Market, Anantnag, J&K"
            className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black"
          />
        </div>

        <div className="pt-2 border-t border-neutral-200 space-y-3">
          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
            Official Signatures & Footer Note
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Left Signatory Title
              </label>
              <input
                type="text"
                value={profile.icTimetableTitle}
                onChange={(e) => onChangeProfile({ icTimetableTitle: e.target.value })}
                placeholder="I/C Timetable"
                className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Right Signatory Title
              </label>
              <input
                type="text"
                value={profile.headmasterTitle}
                onChange={(e) => onChangeProfile({ headmasterTitle: e.target.value })}
                placeholder="Headmaster Signature & Seal"
                className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Footer Note / Staff Guidelines
            </label>
            <textarea
              rows={2}
              value={profile.footerNote}
              onChange={(e) => onChangeProfile({ footerNote: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
