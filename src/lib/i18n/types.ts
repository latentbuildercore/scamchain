export type SupportedLocale = 'en' | 'hi' | 'hinglish' | 'kn' | 'ta' | 'te';

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latn',
    direction: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Deva',
    direction: 'ltr',
  },
  hinglish: {
    code: 'hinglish',
    name: 'Hinglish',
    nativeName: 'Hinglish (हिन्दी/Eng)',
    script: 'Latn',
    direction: 'ltr',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Knda',
    direction: 'ltr',
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Taml',
    direction: 'ltr',
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telu',
    direction: 'ltr',
  },
};

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface TranslationDictionary {
  common: {
    appName: string;
    tagline: string;
    subTagline: string;
    simulatedEnv: string;
    newInvestigation: string;
    investigate: string;
    campaigns: string;
    overview: string;
    learnMore: string;
    loading: string;
    error: string;
    success: string;
    close: string;
    cancel: string;
    clear: string;
    submit: string;
    copy: string;
    copied: string;
    download: string;
    reset: string;
    details: string;
    showDetails: string;
    hideDetails: string;
    back: string;
    all: string;
    none: string;
    language: string;
    autoDetect: string;
    selectLanguage: string;
    demoNote: string;
    syntheticDemo: string;
    evidenceBased: string;
    confidence: string;
    verified: string;
    unverified: string;
    stage: string;
    status: string;
    active: string;
    emerging: string;
    monitoring: string;
    neutralized: string;
  };
  nav: {
    overview: string;
    investigate: string;
    campaigns: string;
    homeAria: string;
    toggleMenuAria: string;
  };
  hero: {
    badge: string;
    heading: string;
    highlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    coreFlow: {
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
      step4Title: string;
      step4Desc: string;
    };
  };
  home: {
    architectureBadge: string;
    architectureTitle: string;
    architectureSubtitle: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar1Footer: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar2Footer: string;
    pillar3Title: string;
    pillar3Desc: string;
    pillar3Footer: string;
    graphSectionBadge: string;
    graphSectionTitle: string;
    graphSectionSubtitle: string;
    graphLiveNodes: string;
    graphSyndicates: string;
    graphVectorClusters: string;
    graphViewFullCampaigns: string;
    readyTitle: string;
    readySubtitle: string;
    readyCta: string;
  };
  investigate: {
    pageBadge: string;
    pageTitle: string;
    pageSubtitle: string;
    pipelineTitle: string;
    stage1Title: string;
    stage1Desc: string;
    stage2Title: string;
    stage2Desc: string;
    stage3Title: string;
    stage3Desc: string;
    modes: {
      url: string;
      text: string;
      screenshot: string;
    };
    form: {
      urlHeader: string;
      textHeader: string;
      screenshotHeader: string;
      urlLabel: string;
      urlPlaceholder: string;
      textLabel: string;
      textPlaceholder: string;
      textSubtitle: string;
      screenshotLabel: string;
      screenshotDropText: string;
      screenshotBrowse: string;
      screenshotHint: string;
      removeScreenshot: string;
      contextLabel: string;
      contextPlaceholder: string;
      contextHint: string;
      submitUrl: string;
      submitText: string;
      submitScreenshot: string;
      samplesLabel: string;
      sampleMessagesLabel: string;
      characterLimit: string;
    };
    loader: {
      urlTarget: string;
      analyzingText: string;
      analyzingImage: string;
      abortNotice: string;
      failedNotice: string;
      stepOf: string;
    };
    results: {
      threatAssessment: string;
      whyWeFlaggedIt: string;
      whatThisCouldMean: string;
      whatWeCouldNotVerify: string;
      recommendedNextSteps: string;
      advancedTechnicalDetails: string;
      identityRisk: string;
      detectedLanguage: string;
      originalMessage: string;
      meaningTranslation: string;
      detectedLinks: string;
      investigateLink: string;
      scanningLink: string;
      linkInvestigationHeading: string;
      linkInvestigationDesc: string;
      exportJson: string;
      downloadReport: string;
      newAnalysis: string;
      newInvestigation: string;
      confidenceLabel: string;
      targetLabel: string;
      correlationStrength: string;
      impersonationWarning: string;
      sensitiveDataWarning: string;
      humorNote: string;
    };
    classifications: {
      legitimate: string;
      suspicious: string;
      scam: string;
      highRisk: string;
      unknown: string;
      humorousSuspicious: string;
    };
  };
  campaigns: {
    directoryBadge: string;
    directoryTitle: string;
    directorySubtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterActive: string;
    filterEmerging: string;
    filterMonitoring: string;
    recordedCount: string;
    activeClusters: string;
    targeting: string;
    incidentsCount: string;
    brandsCount: string;
    vectorLabel: string;
    viewCampaign: string;
    emptySearch: string;
    clearFilters: string;
    detail: {
      backToDirectory: string;
      campaignCode: string;
      statusActive: string;
      statusEmerging: string;
      statusMonitoring: string;
      overviewHeading: string;
      targetedBrandsHeading: string;
      observableEvidenceHeading: string;
      threatIndicatorsHeading: string;
      linkedIncidentsHeading: string;
      noIncidents: string;
      investigateWebsiteAction: string;
      investigateMessageAction: string;
      similarityScoreLabel: string;
      relationshipExplorerHeading: string;
      relationshipExplorerSubtitle: string;
      viewGraph: string;
      viewTable: string;
      filterAll: string;
      filterIncidents: string;
      filterInfrastructure: string;
      filterIndicators: string;
      filterBrands: string;
      connectionStrong: string;
      connectionModerate: string;
      connectionWeak: string;
      evidenceMatched: string;
      signalsChecklist: string;
      selectIncidentToInspect: string;
    };
  };
  report: {
    title: string;
    subTitle: string;
    printPdf: string;
    downloadHtml: string;
    closeDialog: string;
    referenceId: string;
    investigationDate: string;
    investigationType: string;
    overallAssessment: string;
    classificationConfidence: string;
    correlationScoreDisclaimer: string;
    extractedMessageText: string;
    detectedLanguage: string;
    findingsEvidence: string;
    identityImpersonationRisk: string;
    sensitiveInfoRequested: string;
    extractedUrls: string;
    urlForensicsHeading: string;
    campaignConnectionsHeading: string;
    recommendationsHeading: string;
    limitationsDisclosures: string;
    footerDisclaimer: string;
  };
  errors: {
    invalidUrl: string;
    emptyMessage: string;
    messageTooLong: string;
    emptyScreenshot: string;
    invalidImageMime: string;
    imageTooLarge: string;
    corruptedImage: string;
    requestFailed: string;
    timeout: string;
    serviceUnavailable: string;
    unknownError: string;
  };
  summaryBar: {
    incidentsAnalyzed: string;
    incidentsSubtext: string;
    campaignClusters: string;
    campaignClustersSubtext: string;
    activeCampaigns: string;
    activeCampaignsSubtext: string;
    emergingCampaign: string;
    emergingCampaignSubtext: string;
    compactTitle: string;
    analyzedLabel: string;
    clustersLabel: string;
    activeLabel: string;
  };
}
