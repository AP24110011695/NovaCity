import React, { memo } from 'react';
import { corporateHubPortfolio } from '../../data/portfolio/portfolioData';
import ContactPanel from './ContactPanel';
const CorporateContact = memo(({ accentColor }) => <ContactPanel contact={corporateHubPortfolio.contact} socialLinks={corporateHubPortfolio.socialLinks} accentColor={accentColor} />);
CorporateContact.displayName = 'CorporateContact'; export default CorporateContact;
