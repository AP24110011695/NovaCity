import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IntroSequence from './IntroSequence'
import LoadingScene from './LoadingScene'
import SpaceScene from './SpaceScene'
import AtmosphereTransition from './AtmosphereTransition'
import CityReveal from './CityReveal'

const SCENES = {
  INTRO: 'intro',
  LOADING: 'loading',
  SPACE: 'space',
  ATMOSPHERE: 'atmosphere',
  CITY: 'city',
}

const BLACK_HOLD_DURATION = 2200
const MISSION_FADE_DURATION = 350
const SCENE_FADE_DURATION = 1.4

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

const LETTERBOX_HEIGHT = '5.5%'

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

  const handleEnterMission = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => {
      setScene(SCENES.ATMOSPHERE)
      setIsFadingOut(false)
    }, MISSION_FADE_DURATION)
  }, [])

  const handleAtmosphereComplete = useCallback(() => {
    setScene(SCENES.CITY)
  }, [])

  if (scene === SCENES.CITY) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <CityReveal />

        {/* Cinematic letterbox bars */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[60] bg-black"
          style={{ height: LETTERBOX_HEIGHT }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] bg-black"
          style={{ height: LETTERBOX_HEIGHT }}
        />
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
      </AnimatePresence>

      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            key="fade-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.22, 0.68, 0.35, 1] }}
            className="pointer-events-none absolute inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>

      {/* Cinematic letterbox bars */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[60] bg-black"
        style={{ height: LETTERBOX_HEIGHT }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] bg-black"
        style={{ height: LETTERBOX_HEIGHT }}
      />
    </div>
  )
}

export default SceneManager