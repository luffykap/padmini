import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Badge, Avatar } from 'react-native-paper';
import { theme } from '../theme/theme';

/**
 * UserStatsCard - Displays user impact statistics with real-time updates
 * 
 * Props:
 * - stats: { peopleHelped, timesHelped, communityRating, requestsCreated, requestsCompleted }
 * - userName: string (optional)
 * - compact: boolean (optional) - show compact version
 */
export function UserStatsCard({ stats, userName, compact = false }) {
  const {
    peopleHelped = 0,
    timesHelped = 0,
    communityRating = 0,
    requestsCreated = 0,
    requestsCompleted = 0
  } = stats || {};

  // Determine rating color
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return theme.colors.safeGreen;
    if (rating >= 3.5) return theme.colors.warningOrange;
    return theme.colors.errorRed;
  };

  // Determine rating icon
  const getRatingIcon = (rating) => {
    if (rating >= 4.5) return '⭐';
    if (rating >= 3.5) return '⚡';
    return '📊';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactStat}>
          <Title style={styles.compactNumber}>{peopleHelped}</Title>
          <Paragraph style={styles.compactLabel}>Helped</Paragraph>
        </View>
        <View style={styles.compactStat}>
          <Title style={styles.compactNumber}>{communityRating}</Title>
          <Paragraph style={styles.compactLabel}>Rating</Paragraph>
        </View>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        {userName && (
          <View style={styles.header}>
            <Avatar.Icon 
              size={40} 
              icon="account" 
              style={styles.avatar}
            />
            <Title style={styles.userName}>{userName}</Title>
          </View>
        )}
        
        <Title style={styles.title}>Your Impact 🌟</Title>
        
        <View style={styles.statsGrid}>
          {/* People Helped */}
          <View style={styles.statCard}>
            <View style={styles.iconContainer}>
              <Title style={styles.icon}>🤝</Title>
            </View>
            <Title style={styles.statNumber}>{peopleHelped}</Title>
            <Paragraph style={styles.statLabel}>People Helped</Paragraph>
          </View>

          {/* Times Helped */}
          <View style={styles.statCard}>
            <View style={styles.iconContainer}>
              <Title style={styles.icon}>💪</Title>
            </View>
            <Title style={styles.statNumber}>{timesHelped}</Title>
            <Paragraph style={styles.statLabel}>Times Helped</Paragraph>
          </View>

          {/* Community Rating */}
          <View style={styles.statCard}>
            <View style={styles.iconContainer}>
              <Title style={styles.icon}>{getRatingIcon(communityRating)}</Title>
            </View>
            <Title style={[styles.statNumber, { color: getRatingColor(communityRating) }]}>
              {communityRating.toFixed(1)}
            </Title>
            <Paragraph style={styles.statLabel}>Rating</Paragraph>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStat}>
            <Paragraph style={styles.secondaryLabel}>Requests Created</Paragraph>
            <Paragraph style={styles.secondaryValue}>{requestsCreated}</Paragraph>
          </View>
          <View style={styles.secondaryStat}>
            <Paragraph style={styles.secondaryLabel}>Completed</Paragraph>
            <Paragraph style={styles.secondaryValue}>{requestsCompleted}</Paragraph>
          </View>
        </View>

        {/* Live Indicator */}
        <View style={styles.liveIndicator}>
          <Badge style={styles.liveBadge} size={8} />
          <Paragraph style={styles.liveText}>Live Stats</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 4,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  userName: {
    marginLeft: 10,
    fontSize: 18,
    color: theme.colors.text,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginBottom: 5,
  },
  icon: {
    fontSize: 32,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  secondaryStat: {
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  liveBadge: {
    backgroundColor: theme.colors.safeGreen,
  },
  liveText: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginLeft: 5,
  },
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  compactStat: {
    alignItems: 'center',
  },
  compactNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  compactLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
});
