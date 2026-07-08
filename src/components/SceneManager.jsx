import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IntroSequence from './IntroSequence'
import LoadingScene from './LoadingScene'
import SpaceScene from './SpaceScene'

// Scene registry — single source of truth for Chapter 1: Arrival.
const SCENES = {
  INTRO: 'intro',
  LOADING: 'loading',
  SPACE: 'space',
}

const BLACK_HOLD_DURATION = 1500 // ms, black screen hold between intro -> loading
const SCENE_FADE_DURATION = 0.8 // seconds, crossfade between scenes

const sceneVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: SCENE_FADE_DURATION, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: SCENE_FADE_DURATION, ease: 'easeInOut' } },
}

const SceneManager = () => {
  const [scene, setScene] = useState(SCENES.INTRO)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const handleIntroEnter = useCallback(() => {
    setIsFadingOut(true)

    setTimeout(() => {
      setScene(SCENES.LOADING)
      setIsFadingOut(false)
    }, BLACK_HOLD_DURATION)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setScene(SCENES.SPACE)
  }, [])

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
            <SpaceScene />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade-to-black transition overlay, used specifically for intro -> loading */}
      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            key="fade-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SceneManager