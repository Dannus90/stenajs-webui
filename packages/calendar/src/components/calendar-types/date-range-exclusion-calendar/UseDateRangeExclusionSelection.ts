import { eachDayOfInterval } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useDateRangeOnClickDayHandler } from "../../../features/date-range/hooks/UseDateRangeOnClickDayHandler";
import { CalendarState, OnClickDay } from "../../../types/CalendarTypes";
import { addDayStateHighlights } from "../../../util/calendar/StateModifier";
import {
  listContainsDate,
  removeDateIfExist,
} from "../../../util/date/DateListTools";
import {
  DateRangeCalendarOnChangeValue,
  DateRangeFocusedInput,
} from "../date-range-calendar/DateRangeCalendar";
import { DateRangeExclusionCalendarProps } from "./DateRangeExclusionCalendar";
import { CalendarWithMonthSwitcherProps } from "../../../features/month-switcher/CalendarWithMonthSwitcher";
import { useInternalPanelState } from "../../../features/internal-panel-state/UseInternalPanelState";

export const useDateRangeExclusionSelection = <T>({
  onChange,
  value,
  statePerMonth,
  onChangePanel,
}: DateRangeExclusionCalendarProps<T>): CalendarWithMonthSwitcherProps<T> => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [focusedInput, setFocusedInput] = useState<DateRangeFocusedInput>(
    "startDate"
  );
  const { currentPanel, setCurrentPanel } = useInternalPanelState(
    onChangePanel
  );

  const [dateInFocus, setDateInFocus] = useState(
    () => (focusedInput && value?.[focusedInput]) ?? new Date()
  );

  const onChangeHandler = useCallback(
    (value: DateRangeCalendarOnChangeValue) => {
      const { startDate, endDate } = value;
      if (onChange) {
        if (startDate && endDate) {
          const dates = eachDayOfInterval({ start: startDate, end: endDate });
          onChange(dates);
        } else if (startDate) {
          onChange([startDate]);
        } else if (endDate) {
          onChange([endDate]);
        }
      }
    },
    [onChange]
  );

  const onClickDayRange = useDateRangeOnClickDayHandler(
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    focusedInput,
    setFocusedInput,
    onChangeHandler
  );

  const onClickDay: OnClickDay<T> = useCallback(
    (day, userData, ev) => {
      if (onChange) {
        if (ev.ctrlKey || ev.metaKey) {
          if (!value) {
            onChange([day.date]);
          } else if (listContainsDate(value, day.date)) {
            onChange(removeDateIfExist(value, day.date));
          } else {
            onChange([...value, day.date]);
          }
        } else {
          onClickDayRange(day, userData, ev);
        }
      }
    },
    [onChange, onClickDayRange, value]
  );
  const statePerMonthWithSelectedDate = useMemo(() => {
    return addHighlighting(statePerMonth, value);
  }, [statePerMonth, value]);

  return {
    onClickDay,
    statePerMonth: statePerMonthWithSelectedDate,
    currentPanel,
    setCurrentPanel,
    dateInFocus,
    setDateInFocus,
  };
};

const addHighlighting = (
  statePerMonth: CalendarState | undefined,
  dateList: Array<Date> | undefined
): CalendarState | undefined => {
  if (!dateList) {
    return statePerMonth;
  }
  return dateList.reduce((statePerMonth, date) => {
    return addDayStateHighlights(statePerMonth, date, ["selected"]);
  }, statePerMonth);
};
