export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-zinc-100 mb-8">📜 Community Guidelines</h1>
      
      <div className="space-y-8 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">1. The Core Principle</h2>
          <p className="leading-relaxed mb-2">
            UniversiTea is a platform for anonymous discussion and campus gossip. You are <strong>Publicly Anonymous</strong> but <strong>Internally Accountable</strong>. Your real identity is never exposed to other users, but the moderation team can take action against your account if you violate these rules.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-red-400 mb-3">2. Zero Tolerance Policy</h2>
          <p className="leading-relaxed mb-4">
            Violation of these rules will result in immediate content removal and potential account suspension or ban:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Doxxing:</strong> Sharing private phone numbers, personal email addresses, home addresses, or student IDs.</li>
            <li><strong>Intimate Content:</strong> Sharing or requesting private photographs or sexual content.</li>
            <li><strong>Harassment & Bullying:</strong> Sustained, targeted harassment of an individual.</li>
            <li><strong>Hate Speech:</strong> Attacking individuals based on race, religion, sexual orientation, or gender.</li>
            <li><strong>Threats:</strong> Any threat of physical violence or self-harm.</li>
            <li><strong>Fake Evidence:</strong> Submitting fabricated receipts to intentionally mislead the community.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-400 mb-3">3. What is Allowed</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Campus rumors and gossip.</li>
            <li>Venting about difficult classes or professors (keep it professional).</li>
            <li>Discussing public events or organizational drama.</li>
            <li>Dropping receipts to verify or debunk claims!</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">4. Reporting & Moderation</h2>
          <p className="leading-relaxed">
            If you see content that violates these rules, use the <strong>Report</strong> button. Reports are reviewed by community moderators. Content is not automatically removed just because it gets reported, but high-priority reports are reviewed quickly.
          </p>
        </section>
      </div>
    </div>
  )
}
