import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/(tabs)" asChild>
            <TabButton>Inicio</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/(tabs)/explore" asChild>
            <TabButton>Explorar</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, isFocused && styles.selectedTab]}>
        <ThemedText type="small" style={[styles.tabLabel, isFocused && styles.selectedLabel]}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}

      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  selectedTab: {
    backgroundColor: '#E0F2FE',
  },
  tabLabel: {
    color: '#64748B',
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#1E3A8A',
  },
});
