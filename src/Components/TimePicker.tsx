import React from "react";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export interface Time {
  hours: number;
  minutes: number;
  meridiem: "AM" | "PM";
  description?: string;
}

interface TimeRangePickerProps {
  startTime: Time;
  endTime: Time;
  onChangeStart: (time: Time) => void;
  onChangeEnd: (time: Time) => void;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const meridiems: ("AM" | "PM")[] = ["AM","PM"];

  const renderSelect = <T extends number | string>(
    label: string,
    value: T,
    onChange: (value: T) => void,
    options: T[]
  ) => (
    <FormControl variant="filled" size="small" sx={{ minWidth: 60, mr: 1 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (typeof value === "number") {
            onChange(Number(val) as T);
          } else {
            onChange(val as T);
          }
        }}
        sx={{
          "& .MuiSelect-icon": { color: "#fff" },
          bgcolor: "#424242",
          "& .MuiFilledInput-root": { color: "#fff" },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.toString()} value={option}>
            {typeof option === "number"
              ? option.toString().padStart(2, "0")
              : option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
  return (
     <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: 15, mt: 2, size: 1000 }}>
      {/* Start Time */}
      {renderSelect("Hour", startTime.hours, (val) =>
        onChangeStart({ ...startTime, hours: Number(val) })
      , hours)}
      {renderSelect("Min", startTime.minutes, (val) =>
        onChangeStart({ ...startTime, minutes: Number(val) })
      , minutes)}
      {renderSelect("A/PM", startTime.meridiem, (val) =>
        onChangeStart({ ...startTime, meridiem: val as "AM" | "PM" })
      , meridiems)}

      <span>-</span>

      {/* End Time */}
      {renderSelect("Hour", endTime.hours, (val) =>
        onChangeEnd({ ...endTime, hours: Number(val) })
      , hours)}
      {renderSelect("Min", endTime.minutes, (val) =>
        onChangeEnd({ ...endTime, minutes: Number(val) })
      , minutes)}
      {renderSelect("A/PM", endTime.meridiem, (val) =>
        onChangeEnd({ ...endTime, meridiem: val as "AM" | "PM" })
      , meridiems)}
    </Box>
  );
};

export default TimeRangePicker;

  