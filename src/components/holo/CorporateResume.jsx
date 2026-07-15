import React, { memo } from 'react';
import { corporateHubPortfolio } from '../../data/portfolio/portfolioData';
import ResumePanel from './ResumePanel';
const CorporateResume = memo(({ accentColor }) => <ResumePanel resume={corporateHubPortfolio.resume} accentColor={accentColor} />);
CorporateResume.displayName = 'CorporateResume'; export default CorporateResume;
