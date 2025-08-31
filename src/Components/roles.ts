export const Roles = {
  BROTHER: "Brother",
  BLUECH_SOCIAL: "Bluech Social",
  OWNER: "Owner",
  NEO: "Neo",
  KKG_SISTER: "KKG Sister",
  KKG_SOCIAL: "KKG Social",
  APHI_SISTER: "APhi Sister",
  APHI_SOCIAL: "APhi Social",
  TRIDELT_SISTER: "TriDelt Sister",
  TRIDELT_SOCIAL: "TriDelt Social",
  DG_SISTER: "DG Sister",
  DG_SOCIAL: "DG Social",
  PHISIG_SISTER: "PhiSig Sister",
  PHISIG_SOCIAL: "PhiSig Social",
  AXO_SISTER: "AXO Sister",
  AXO_SOCIAL: "AXO Social",
  AEPHI_SISTER: "AEPhi Sister",
  AEPHI_SOCIAL: "AEPhi Social",
  SDT_SISTER: "SDT Sister",
  SDT_SOCIAL: "SDT Social",
  AXID_SISTER: "AXID Sister",
  AXID_SOCIAL: "AXID Social",
  THETA_SISTER: "Theta Sister",
  THETA_SOCIAL: "Theta Social",
  AGD_SISTER: "AGD Sister",
  AGD_SOCIAL: "AGD Social",
  DPHIE_SISTER: "DphiE Sister",
  DPHIE_SOCIAL: "DphiE Social",
  THETA_CHI_BROTHER: "Theta Chi Brother",
  THETA_CHI_SOCIAL: "Theta Chi Social",
  DKE_BROTHER:  "DKE Brother",
  DKE_SOCIAL:   "DKE Social",
  DU_BROTHER:   "DU Brother",
  DU_SOCIAL:    "DU Social",
  ZBT_BROTHER:  "ZBT Brother",
  ZBT_SOCIAL:   "ZBT Social",
  AEPI_BROTHER: "AEPI Brother",
  AEPI_SOCIAL:  "AEPI Social",
  SAE_BROTHER:  "SAE Brother",
  SAE_SOCIAL:   "SAE Social",
  PIKE_BROTHER: "PIKE Brother",
  PIKE_SOCIAL:  "PIKE Social",
  SAMMY_BROTHER:"Sammy Brother",
  SAMMY_SOCIAL: "Sammy Social",
  TKE_BROTHER:  "TKE Brother",
  TKE_SOCIAL:   "TKE Social",
  PSI_U_BROTHER:"Psi U Brother",
  PSI_U_SOCIAL: "Psi U Social",
  DTD_BROTHER: "DTD Brother",
  DTD_SOCIAL:  "DTD Social"
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const houseToRolesMap: Record<string, string[]> = {
  KKG: [Roles.KKG_SISTER, Roles.KKG_SOCIAL],
  APHI: [Roles.APHI_SISTER, Roles.APHI_SOCIAL],
  TRIDELT: [Roles.TRIDELT_SISTER, Roles.TRIDELT_SOCIAL],
  DG: [Roles.DG_SISTER, Roles.DG_SOCIAL],
  PHISIG: [Roles.PHISIG_SISTER, Roles.PHISIG_SOCIAL],
  AXO: [Roles.AXO_SISTER, Roles.AXO_SOCIAL],
  AEPHI: [Roles.AEPHI_SISTER, Roles.AEPHI_SOCIAL],
  SDT: [Roles.SDT_SISTER, Roles.SDT_SOCIAL],
  AXID: [Roles.AXID_SISTER, Roles.AXID_SOCIAL],
  THETA: [Roles.THETA_SISTER, Roles.THETA_SOCIAL],
  AGD: [Roles.AGD_SISTER, Roles.AGD_SOCIAL],
  DPHIE: [Roles.DPHIE_SISTER, Roles.DPHIE_SOCIAL],
  THETA_CHI: [Roles.THETA_CHI_BROTHER, Roles.THETA_CHI_SOCIAL],
  DKE: [Roles.DKE_BROTHER, Roles.DKE_SOCIAL],
  DU: [Roles.DU_BROTHER, Roles.DU_SOCIAL],
  ZBT: [Roles.ZBT_BROTHER, Roles.ZBT_SOCIAL],
  AEPI: [Roles.AEPI_BROTHER, Roles.AEPI_SOCIAL],
  SAE: [Roles.SAE_BROTHER, Roles.SAE_SOCIAL],
  PIKE: [Roles.PIKE_BROTHER, Roles.PIKE_SOCIAL],
  SAMMY: [Roles.SAMMY_BROTHER, Roles.SAMMY_SOCIAL],
  TKE: [Roles.TKE_BROTHER, Roles.TKE_SOCIAL],
  PSI_U: [Roles.PSI_U_BROTHER, Roles.PSI_U_SOCIAL],
  SIG_CHI: [Roles.BROTHER, Roles.BLUECH_SOCIAL, Roles.OWNER, Roles.NEO],
  DTD: [Roles.DTD_BROTHER,Roles.DTD_SOCIAL]
};

export const getUserHouse = (role: Role): string | null => {
  for (const [house, roles] of Object.entries(houseToRolesMap)) {
    if (roles.includes(role)) return house;
  }
  return null;
};



  

