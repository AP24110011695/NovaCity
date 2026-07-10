import { useEffect } from 'react'

import Lenis from 'lenis'

import Navigation from './Navigation'

import Hero from './Hero'

import About from './About'

import Skills from './Skills'

import Projects from './Projects'

import Experience from './Experience'

import Contact from './Contact'

import Footer from './Footer'



export default function Portfolio() {

  useEffect(() => {

    const lenis = new Lenis({

      duration: 1.1,

      smoothWheel: true,

    })



    let rafId = 0

    const raf = (time) => {

      lenis.raf(time)

      rafId = requestAnimationFrame(raf)

    }

    rafId = requestAnimationFrame(raf)



    return () => {

      cancelAnimationFrame(rafId)

      lenis.destroy()

    }

  }, [])



  return (

    <>

      <div

        className="pointer-events-none fixed inset-0 z-[1]"

        style={{

          background:

            'linear-gradient(to bottom, rgba(8,10,16,0.35) 0%, transparent 20%, transparent 75%, rgba(8,10,16,0.6) 100%)',

        }}

      />



      <main className="relative z-[2] min-h-screen w-full bg-transparent text-white">

        <Navigation />

        <Hero />

        <About />

        <Skills />

        <Projects />

        <Experience />

        <Contact />

        <Footer />

      </main>

    </>

  )

}

