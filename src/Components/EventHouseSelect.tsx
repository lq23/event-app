import React from "react";
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from "@mui/material";
import { Roles } from "../Components/roles";
import generateUniqueId from "../Components/generateUniqueId";

// Define a custom event type that includes all needed properties.
interface AppEvent {
  id: string;
  title: string;
  date: Date;
  description: string;
  rolesAllowedToView: string[];
  rolesAllowedToEdit: string[];
}


// Define only the house roles you want to list (e.g. the sister roles)
// Mapping from a house (sorority abbreviation) to its two roles.
const houseToRolesMap: Record<string, string[]> = {
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
  const whatHouses: string[] = Object.keys(houseToRolesMap);
  const selectedRoles = whatHouses.flatMap(house => houseToRolesMap[house] || []);

  const newEvent: AppEvent = {
    id: generateUniqueId().toString(),
    title: "New Event", // or use a state variable input for the title
    date: new Date(),   // or the selected date, for example currentDate
    description: "",
    rolesAllowedToView: selectedRoles,    // Only those houses can see this event.
    rolesAllowedToEdit: [], // Assign editing roles as needed.
  };

// You can integrate your event logic inside a component if needed.
// For now we wrap the UI in a functional component.
const EventHouseSelect: React.FC = () => {
  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="house-select-label">House</InputLabel>
        <Select labelId="house-select-label" id="house-select">
          {whatHouses.map((house) => (
            <MenuItem key={house} value={house}>
              <Checkbox checked={false} />
              <ListItemText primary={house} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default EventHouseSelect;