import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#F8FAFC"
      disableTransparentOnScrollEdge
      shadowColor="#E2E8F0"
      rippleColor="#E0F2FE"
      indicatorColor="#E0F2FE"
      tintColor="#1E3A8A"
      iconColor={{ default: '#64748B', selected: '#1E3A8A' }}
      labelStyle={{ color: '#64748B', selected: { color: '#1E3A8A', fontWeight: '600' } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="promociones">
        <NativeTabs.Trigger.Label>Promos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tag.fill" md="local_offer" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="avisos">
        <NativeTabs.Trigger.Label>Avisos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
