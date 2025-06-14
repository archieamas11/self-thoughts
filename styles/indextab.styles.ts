import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 44,
    height: 44,
  },
  moodFilterContainer: {
    paddingHorizontal: 16, // Reduced from 24
    paddingVertical: 10,
  },
  moodFilterContent: {
    alignItems: 'center',
  },
  moodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  activeMoodButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  moodButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeMoodButtonText: {
    color: '#FFFFFF',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 16, // Reduced from 24
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Changed from 16
    padding: 16, // Changed from 20
    marginBottom: 12, // Changed from 16
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1, // Changed from 2
    },
    shadowOpacity: 0.08, // Changed from 0.1
    shadowRadius: 2.62, // Changed from 3.84
    elevation: 3, // Changed from 5
  },
  archivedEntryCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Changed from 12
  },
  entryMood: {
    fontSize: 24,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  entryTitle: {
    fontSize: 17, // Changed from 18
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6, // Changed from 8
  },
  entryContent: {
    fontSize: 13, // Changed from 14
    color: '#4B5563',
    lineHeight: 18, // Changed from 20
    marginBottom: 8, // Changed from 12
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4, // Added for slight separation
  },
  favoriteButton: {
    padding: 6, // Changed from 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default styles

