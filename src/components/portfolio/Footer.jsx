import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { navLinks, profile } from '../../data/profile'

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[rgba(8,10,16,0.35)] px-6 py-12 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#6B93FF]">
            Nova City
          </p>
          <p className="mt-2 text-lg font-semibold">{profile.name}</p>
          <p className="mt-1 text-sm text-gray-400">
            The First Human Civilization Beyond Earth.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-gray-400">
          {navLinks.slice(1).map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="text-left transition hover:text-[#6B93FF]"
            >
              {link.section}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-4">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition hover:text-[#6B93FF]"
            aria-label="GitHub"
          >
            <FaGithub size={20} />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition hover:text-[#6B93FF]"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={20} />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="text-gray-400 transition hover:text-[#6B93FF]"
            aria-label="Email"
          >
            <HiOutlineMail size={22} />
          </a>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl border-t border-white/5 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {profile.name} • Nova City
      </p>
    </footer>
  )
}
