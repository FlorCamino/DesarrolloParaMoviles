import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      disableTransparentOnScrollEdge
      shadowColor="#E2E8F0"
      rippleColor="#E8EFFF"
      indicatorColor="#E8EFFF"
      tintColor="#2455B8"
      iconColor={{ default: '#64748B', selected: '#2455B8' }}
      labelStyle={{ color: '#64748B', selected: { color: '#2455B8', fontWeight: '600' } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="comercios">
        <NativeTabs.Trigger.Label>Comercios</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="storefront.fill" md="storefront" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mapa">
        <NativeTabs.Trigger.Label>Mapa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
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
