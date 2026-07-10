import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { profile } from '../../data/profile'
import SectionHeading from './SectionHeading'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Nova City — Message from ${form.name}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    )
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <section id="contact" className="px-6 py-24 text-white">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          label="Communication Terminal"
          title="Contact"
          align="center"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-center text-gray-300"
        >
          Establish a connection with Nova City. Whether it&apos;s collaboration,
          opportunities, or a conversation about technology — the terminal is open.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm transition hover:border-[#4F7CFF]/50 hover:text-[#6B93FF]"
          >
            <HiOutlineMail size={18} />
            {profile.email}
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm transition hover:border-[#4F7CFF]/50 hover:text-[#6B93FF]"
          >
            <FaGithub size={18} />
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm transition hover:border-[#4F7CFF]/50 hover:text-[#6B93FF]"
          >
            <FaLinkedin size={18} />
            LinkedIn
          </a>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mt-12 space-y-5 rounded-xl border border-white/10 bg-[rgba(8,10,16,0.25)] p-6 backdrop-blur-sm md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[rgba(8,10,16,0.6)] px-4 py-3 outline-none transition focus:border-[#4F7CFF]"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[rgba(8,10,16,0.6)] px-4 py-3 outline-none transition focus:border-[#4F7CFF]"
                placeholder="your@email.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-gray-400">Message</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full resize-none rounded-lg border border-white/10 bg-[rgba(8,10,16,0.6)] px-4 py-3 outline-none transition focus:border-[#4F7CFF]"
              placeholder="Your message..."
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#4F7CFF] py-3 font-semibold transition hover:bg-[#6B93FF] md:w-auto md:px-10"
          >
            Send Transmission
          </button>

          {submitted && (
            <p className="text-center text-sm text-[#6B93FF]">
              Your email client should open shortly.
            </p>
          )}
        </motion.form>
      </div>
    </section>
  )
}
