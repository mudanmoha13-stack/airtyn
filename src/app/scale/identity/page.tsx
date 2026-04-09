"use client";

import React, { useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IdentityScalePage() {
  const { ssoConfig, scimConfig, configureSso, configureScim, syncScim } = useAppState();
  const [provider, setProvider] = useState<'okta' | 'azure_ad' | 'google_workspace' | 'custom_saml'>(ssoConfig?.provider ?? 'okta');
  const [enabled, setEnabled] = useState<boolean>(ssoConfig?.enabled ?? false);
  const [domain, setDomain] = useState(ssoConfig?.domain ?? 'acme.com');
  const [signInUrl, setSignInUrl] = useState(ssoConfig?.signInUrl ?? 'https://idp.acme.com/sso');
  const [issuer, setIssuer] = useState(ssoConfig?.issuer ?? 'pinkplan-sp');
  const [fingerprint, setFingerprint] = useState(ssoConfig?.certificateFingerprint ?? 'SHA256:ABCD1234');

  const [scimEnabled, setScimEnabled] = useState<boolean>(scimConfig?.enabled ?? false);
  const [scimEndpoint, setScimEndpoint] = useState(scimConfig?.endpoint ?? 'https://api.pinkplan.app/scim/v2');
  const [tokenPreview, setTokenPreview] = useState(scimConfig?.tokenPreview ?? 'sk_live_xxx...');

  const provisionSummary = useMemo(() => {
    if (!scimConfig) return 'No sync yet';
    return `${scimConfig.usersProvisioned} users, ${scimConfig.groupsProvisioned} groups provisioned`;
  }, [scimConfig]);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SSO and SCIM</h1>
          <p className="text-muted-foreground">Configure enterprise identity and directory provisioning.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Single Sign-On</CardTitle>
              <CardDescription>SAML-based sign-in for enterprise users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="text-sm font-medium">Enable SSO</p>
                  <p className="text-xs text-muted-foreground">Users can sign in via your identity provider.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v: 'okta' | 'azure_ad' | 'google_workspace' | 'custom_saml') => setProvider(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="okta">Okta</SelectItem>
                    <SelectItem value="azure_ad">Azure AD</SelectItem>
                    <SelectItem value="google_workspace">Google Workspace</SelectItem>
                    <SelectItem value="custom_saml">Custom SAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Verified Domain</Label><Input value={domain} onChange={(e) => setDomain(e.target.value)} /></div>
              <div className="space-y-2"><Label>Sign-in URL</Label><Input value={signInUrl} onChange={(e) => setSignInUrl(e.target.value)} /></div>
              <div className="space-y-2"><Label>Issuer</Label><Input value={issuer} onChange={(e) => setIssuer(e.target.value)} /></div>
              <div className="space-y-2"><Label>Certificate Fingerprint</Label><Input value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} /></div>
              <Button className="w-full" onClick={() => configureSso({ provider, enabled, domain, signInUrl, issuer, certificateFingerprint: fingerprint })}>Save SSO Configuration</Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>SCIM Provisioning</CardTitle>
              <CardDescription>Automate user and group lifecycle from your IdP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="text-sm font-medium">Enable SCIM</p>
                  <p className="text-xs text-muted-foreground">Keep users and groups in sync.</p>
                </div>
                <Switch checked={scimEnabled} onCheckedChange={setScimEnabled} />
              </div>
              <div className="space-y-2"><Label>SCIM Endpoint</Label><Input value={scimEndpoint} onChange={(e) => setScimEndpoint(e.target.value)} /></div>
              <div className="space-y-2"><Label>Bearer Token</Label><Input value={tokenPreview} onChange={(e) => setTokenPreview(e.target.value)} /></div>
              <div className="text-xs text-muted-foreground border rounded-md p-3">
                <p>Last Sync: {scimConfig?.lastSyncAt ? new Date(scimConfig.lastSyncAt).toLocaleString() : 'Never'}</p>
                <p>{provisionSummary}</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => configureScim({ enabled: scimEnabled, endpoint: scimEndpoint, tokenPreview, usersProvisioned: scimConfig?.usersProvisioned ?? 0, groupsProvisioned: scimConfig?.groupsProvisioned ?? 0 })}>Save SCIM</Button>
                <Button className="flex-1" onClick={syncScim} disabled={!scimConfig?.enabled}>Run Sync</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
