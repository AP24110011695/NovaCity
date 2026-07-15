import { useCallback, useMemo, useState } from 'react';

export const filterAndSortSkills = (skills, { category = 'All', searchQuery = '', sortBy = 'category' } = {}) => {
  const query = searchQuery.trim().toLocaleLowerCase();
  const filtered = skills.filter((skill) => (
    (category === 'All' || skill.category === category)
    && (!query || [skill.name, skill.category, skill.description].some((value) => value.toLocaleLowerCase().includes(query)))
  ));

  return [...filtered].sort((first, second) => {
    if (sortBy === 'proficiency') return first.proficiency.localeCompare(second.proficiency) || first.name.localeCompare(second.name);
    if (sortBy === 'years') return second.years - first.years || first.name.localeCompare(second.name);
    return first.category.localeCompare(second.category) || first.name.localeCompare(second.name);
  });
};

export const useSkillFilters = (skills) => {
  const [filters, setFilters] = useState({ category: 'All', searchQuery: '', sortBy: 'category' });
  const setCategory = useCallback((category) => setFilters((current) => ({ ...current, category })), []);
  const setSearchQuery = useCallback((searchQuery) => setFilters((current) => ({ ...current, searchQuery })), []);
  const setSortBy = useCallback((sortBy) => setFilters((current) => ({ ...current, sortBy })), []);
  const filteredSkills = useMemo(() => filterAndSortSkills(skills, filters), [filters, skills]);

  return { filters, filteredSkills, setCategory, setSearchQuery, setSortBy };
};
