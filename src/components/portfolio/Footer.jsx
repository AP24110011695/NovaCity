import { motion } from 'framer-motion'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { navLinks, profile } from '../../data/profile'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* Faux city-coordinate display */
function CityCoord({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.4em] text-gray-700">{label}</span>
      <span className="font-mono text-[11px] text-gray-500">{value}</span>
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] text-white">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-60"
        style={{
          background:
            'linear-gradient(to bottom, rgba(79,124,255,0.04), transparent)',
        }}
        aria-hidden
      />

      {/* Top gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(79,124,255,0.4) 40%, rgba(79,124,255,0.4) 60%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* Main footer content */}
        <div className="flex flex-col gap-12 py-16 md:flex-row md:justify-between">

          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: NOVA_EASE }}
            className="max-w-xs"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#6B93FF]">
              Nova City
            </p>
            <p className="mt-2 text-xl font-bold tracking-tight">{profile.name}</p>
            <p className="mt-2 text-[13px] leading-6 text-gray-500">
              The first human civilization beyond Earth.
            </p>

            {/* Faux city coordinates */}
            <div className="mt-6 flex gap-5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <CityCoord label="Sector" value="7-Alpha" />
              <CityCoord label="Elevation" value="342m" />
              <CityCoord label="Status" value="Online" />
            </div>
          </motion.div>

          {/* Nav columns */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: NOVA_EASE }}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gray-600">
              Districts
            </p>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3">
              {navLinks.slice(1).map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(link.id)}
                    className="text-left text-[13px] text-gray-500 transition-colors duration-150 hover:text-[#6B93FF]"
                  >
                    {link.label ?? link.section}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: NOVA_EASE }}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gray-600">
              Channels
            </p>
            <div className="flex flex-col gap-3">
              {[
                { href: profile.github, Icon: FaGithub, label: 'GitHub', size: 16, external: true },
                { href: profile.linkedin, Icon: FaLinkedin, label: 'LinkedIn', size: 16, external: true },
                { href: `mailto:${profile.email}`, Icon: HiOutlineMail, label: profile.email, size: 17 },
              ].map(({ href, Icon, label, size, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex items-center gap-2.5 text-[13px] text-gray-500 transition-colors duration-150 hover:text-[#6B93FF]"
                >
                  <Icon size={size} />
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] py-6 md:flex-row">
          <p className="text-[12px] text-gray-600">
            © {year} {profile.name} · Nova City
          </p>
          <p className="font-mono text-[11px] text-gray-700">
            NCID-{year}-{profile.name.replace(/\s+/g, '').toUpperCase().slice(0, 6)}
          </p>
        </div>
      </div>
    </footer>
  )
}