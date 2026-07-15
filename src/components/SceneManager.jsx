import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import IntroSequence from './IntroSequence'

import LoadingScene from './LoadingScene'

import SpaceScene from './SpaceScene'

import AtmosphereTransition from './AtmosphereTransition'

import CityReveal from './CityReveal'

const Portfolio = lazy(() => import('./portfolio/Portfolio'))

const PortfolioFallback = () => (
  <div className="min-h-screen pt-16" role="status" aria-label="Loading portfolio experience">
    <div className="mx-auto h-px w-40 bg-gradient-to-r from-transparent via-[#4f7cff]/60 to-transparent shadow-[0_0_18px_rgba(79,124,255,0.35)]" />
  </div>
)



const SCENES = {

  INTRO: 'intro',

  LOADING: 'loading',

  SPACE: 'space',

  ATMOSPHERE: 'atmosphere',

  CITY: 'city',

  ARRIVAL: 'arrival',

  PORTFOLIO: 'portfolio',

}



const BLACK_HOLD_DURATION = 650

const MISSION_FADE_DURATION = 1200

const SCENE_FADE_DURATION = 1.4

const ARRIVAL_HOLD_DURATION = 2200

const PORTFOLIO_FADE_DURATION = 2.4



const sceneVariants = {

  initial: { opacity: 0 },

  animate: {

    opacity: 1,

    transition: { duration: SCENE_FADE_DURATION, ease: [0.22, 0.68, 0.35, 1] },

  },

  exit: {

    opacity: 0,

    transition: { duration: SCENE_FADE_DURATION, ease: [0.22, 0.68, 0.35, 1] },

  },

}



const NOVA_EASE = [0.22, 0.68, 0.35, 1]



const SceneManager = () => {

  const [scene, setScene] = useState(SCENES.INTRO)

  const [isFadingOut, setIsFadingOut] = useState(false)

  const [citySettled, setCitySettled] = useState(false)

  const [portfolioVisible, setPortfolioVisible] = useState(false)

  const [arrivalCaption, setArrivalCaption] = useState(false)



  useEffect(() => {

    const root = document.getElementById('root')

    const isPortfolio =

      scene === SCENES.PORTFOLIO || scene === SCENES.ARRIVAL

    document.documentElement.classList.toggle('portfolio-mode', isPortfolio)

    document.body.classList.toggle('portfolio-mode', isPortfolio)

    root?.classList.toggle('portfolio-mode', isPortfolio)

  }, [scene])



  const handleIntroEnter = useCallback(() => {

    setIsFadingOut(true)

    setTimeout(() => {

      setScene(SCENES.SPACE)

      setIsFadingOut(false)

    }, BLACK_HOLD_DURATION)

  }, [])



  const handleLoadingComplete = useCallback(() => {

    setScene(SCENES.SPACE)

  }, [])



  const handleEnterMission = useCallback(() => {

    setScene(SCENES.CITY)

  }, [])



  const handleAtmosphereComplete = useCallback(() => {

    setScene(SCENES.CITY)

  }, [])



  const handleCitySettled = useCallback(() => {

    setCitySettled(true)

    setScene(SCENES.ARRIVAL)

    setArrivalCaption(true)



    setTimeout(() => {

      setScene(SCENES.PORTFOLIO)

      setPortfolioVisible(true)

    }, ARRIVAL_HOLD_DURATION)

  }, [])



  const isCityExperience =

    scene === SCENES.CITY ||

    scene === SCENES.ARRIVAL ||

    scene === SCENES.PORTFOLIO



  if (isCityExperience) {

    return (

      <div className="relative w-full">

        <div className="pointer-events-none fixed inset-0 z-0">

          <CityReveal

            phase={citySettled ? 'settled' : 'flythrough'}

            onSettled={handleCitySettled}

            dimmed={portfolioVisible}

          />



        </div>



        <AnimatePresence>

          {arrivalCaption && !portfolioVisible && (

            <motion.div

              key="arrival-caption"

              initial={{ opacity: 0, y: 16 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -12 }}

              transition={{ duration: 1.4, ease: NOVA_EASE }}

              className="pointer-events-none fixed inset-x-0 bottom-[14%] z-[55] text-center"

            >

              <p className="text-xs font-light tracking-[0.45em] text-white/50 sm:text-sm">

                ARRIVAL CONFIRMED

              </p>

              <p className="mt-3 text-2xl font-semibold tracking-[0.12em] text-white sm:text-3xl md:text-4xl">

                Welcome to Nova City

              </p>

            </motion.div>

          )}

        </AnimatePresence>



        <AnimatePresence>

          {portfolioVisible && (

            <motion.div

              key="portfolio-overlay"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              transition={{ duration: PORTFOLIO_FADE_DURATION, ease: NOVA_EASE }}

              className="relative z-10"

            >

              <Suspense fallback={<PortfolioFallback />}>
                <Portfolio />
              </Suspense>

            </motion.div>

          )}

        </AnimatePresence>

      </div>

    )

  }



  return (

    <div className="relative h-screen w-full overflow-hidden bg-black">

      <AnimatePresence mode="wait">

        {scene === SCENES.INTRO && (

          <motion.div

            key="intro"

            variants={sceneVariants}

            initial="initial"

            animate="animate"

            exit="exit"

            className="absolute inset-0"

          >

            <IntroSequence onEnter={handleIntroEnter} />

          </motion.div>

        )}



        {scene === SCENES.LOADING && (

          <motion.div

            key="loading"

            variants={sceneVariants}

            initial="initial"

            animate="animate"

            exit="exit"

            className="absolute inset-0"

          >

            <LoadingScene onComplete={handleLoadingComplete} />

          </motion.div>

        )}



        {scene === SCENES.SPACE && (

          <motion.div

            key="space"

            variants={sceneVariants}

            initial="initial"

            animate="animate"

            exit="exit"

            className="absolute inset-0"

          >

            <SpaceScene onEnterMission={handleEnterMission} />

          </motion.div>

        )}



        {scene === SCENES.ATMOSPHERE && (

          <motion.div

            key="atmosphere"

            variants={sceneVariants}

            initial="initial"

            animate="animate"

            exit="exit"

            className="absolute inset-0"

          >

            <AtmosphereTransition onComplete={handleAtmosphereComplete} />

          </motion.div>

        )}



        {/* ATMOSPHERE scene is now bypassed as SpaceScene handles the seamless descent directly */}

      </AnimatePresence>



      <AnimatePresence>

        {isFadingOut && (

          <motion.div

            key="fade-overlay"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            transition={{ duration: 1.2, ease: NOVA_EASE }}

            className="pointer-events-none absolute inset-0 z-50 bg-black"

          />

        )}

      </AnimatePresence>



    </div>

  )

}



export default SceneManager

