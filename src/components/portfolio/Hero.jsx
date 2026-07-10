import { motion } from 'framer-motion'

import { FaGithub, FaLinkedin, FaFileDownload } from 'react-icons/fa'

import { HiOutlineMail } from 'react-icons/hi'

import { profile } from '../../data/profile'



const scrollTo = (id) => {

  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

}



const NOVA_EASE = [0.22, 0.68, 0.35, 1]



export default function Hero() {

  return (

    <section

      id="hero"

      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-6 pt-24"

    >

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,124,255,0.06),transparent_65%)]" />



      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center md:px-8 md:py-20">

        <motion.p

          initial={{ opacity: 0, y: 12 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.7, delay: 0.3, ease: NOVA_EASE }}

          className="mb-4 text-xs uppercase tracking-[0.5em] text-[#6B93FF]"

        >

          Nova City Headquarters

        </motion.p>



        <motion.p

          initial={{ opacity: 0, y: 14 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.8, delay: 0.7, ease: NOVA_EASE }}

          className="mb-8 text-sm uppercase tracking-[0.45em] text-blue-300/80"

        >

          Welcome to Nova City

        </motion.p>



        <motion.h1

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.9, delay: 1.1, ease: NOVA_EASE }}

          className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"

          style={{ textShadow: '0 0 60px rgba(79,124,255,0.2)' }}

        >

          {profile.name.toUpperCase()}

        </motion.h1>



        <motion.p

          initial={{ opacity: 0, y: 18 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.9, delay: 1.3, ease: NOVA_EASE }}

          className="mx-auto mb-3 max-w-2xl text-lg text-gray-200 md:text-xl"

        >

          {profile.title}

        </motion.p>



        <motion.p

          initial={{ opacity: 0, y: 18 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.9, delay: 1.45, ease: NOVA_EASE }}

          className="mx-auto mb-10 max-w-xl text-base text-gray-400"

        >

          {profile.tagline}

        </motion.p>



        <motion.div

          initial={{ opacity: 0, y: 18 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.9, delay: 1.65, ease: NOVA_EASE }}

          className="flex flex-wrap justify-center gap-3"

        >

          <button

            type="button"

            onClick={() => scrollTo('projects')}

            className="rounded-lg bg-[#4F7CFF]/90 px-7 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-[#6B93FF]"

          >

            Explore District

          </button>



          <button

            type="button"

            onClick={() => scrollTo('contact')}

            className="rounded-lg border border-white/20 bg-white/[0.04] px-7 py-3 text-sm font-semibold backdrop-blur-sm transition hover:border-[#4F7CFF]/60 hover:bg-white/5"

          >

            Open Terminal

          </button>



          <a

            href={profile.resumeUrl}

            target="_blank"

            rel="noopener noreferrer"

            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-7 py-3 text-sm font-semibold backdrop-blur-sm transition hover:border-[#4F7CFF]/50 hover:text-blue-300"

          >

            <FaFileDownload />

            Resume

          </a>

        </motion.div>



        <motion.div

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ duration: 1, delay: 2.0, ease: NOVA_EASE }}

          className="mt-12 flex justify-center gap-6"

        >

          <a

            href={profile.github}

            target="_blank"

            rel="noopener noreferrer"

            className="text-gray-400 transition hover:text-[#6B93FF]"

            aria-label="GitHub"

          >

            <FaGithub size={22} />

          </a>

          <a

            href={profile.linkedin}

            target="_blank"

            rel="noopener noreferrer"

            className="text-gray-400 transition hover:text-[#6B93FF]"

            aria-label="LinkedIn"

          >

            <FaLinkedin size={22} />

          </a>

          <a

            href={`mailto:${profile.email}`}

            className="text-gray-400 transition hover:text-[#6B93FF]"

            aria-label="Email"

          >

            <HiOutlineMail size={24} />

          </a>

        </motion.div>

      </div>

    </section>

  )

}

