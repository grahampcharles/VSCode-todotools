export const dateLocaleOptions = (): Intl.DateTimeFormatOptions[] => {
    const months = ["numeric", "2-digit"];
    const days = ["numeric", "2-digit"];
    const years = ["numeric", "2-digit", undefined];

    // TODO: figure out how to do these two in one statement
    const damos = months.flatMap((month) =>
        days.flatMap((day) => ({ month: month, day: day }))
    );
    const locales = damos.flatMap((damo) =>
        years.flatMap(
            (year) => ({ ...damo, year: year } as Intl.DateTimeFormatOptions)
        )
    );

    return locales;
};
