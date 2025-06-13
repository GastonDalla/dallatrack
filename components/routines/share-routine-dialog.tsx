'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Share2, Copy, Calendar, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/contexts/LanguageContext'
import { SharedRoutine } from '@/types'
import QRCode from 'qrcode'

interface ShareRoutineDialogProps {
  routineId: string
  routineName: string
  children?: React.ReactNode
}

export function ShareRoutineDialog({ 
  routineId, 
  routineName, 
  children 
}: ShareRoutineDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareData, setShareData] = useState<{
    sharedRoutine: SharedRoutine
    shareUrl: string
  } | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  const [hasExpiration, setHasExpiration] = useState(false)
  const [expirationDays, setExpirationDays] = useState(30)
  const [hasMaxUses, setHasMaxUses] = useState(false)
  const [maxUses, setMaxUses] = useState(10)
  const { toast } = useToast()
  const t = useTranslations()

  const shareRoutineMutation = useMutation({
    mutationFn: async (shareConfig: {
      routineId: string
      expiresIn?: number
      maxUses?: number
    }) => {
      const response = await ofetch<{
        sharedRoutine: SharedRoutine
        shareUrl: string
      }>('/api/routines/share', {
        method: 'POST',
        body: shareConfig
      })
      return response
    },
    onSuccess: async (data) => {
      setShareData(data)

      try {
        const qrCode = await QRCode.toDataURL(data.shareUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(qrCode)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }

      toast({
        title: t.sharing.shareRoutine.routineShared,
        description: t.sharing.shareRoutine.sharedSuccessfully
      })
    },
    onError: (error: any) => {
      console.error('Error sharing routine:', error)
      toast({
        title: t.sharing.shareRoutine.errorSharing,
        description: error?.data?.error || error?.message || t.sharing.shareRoutine.errorSharing,
        variant: "destructive"
      })
    }
  })

  const handleShare = () => {
    const requestBody: any = {
      routineId
    }
    
    if (hasExpiration) {
      requestBody.expiresIn = expirationDays
    }
    
    if (hasMaxUses) {
      requestBody.maxUses = maxUses
    }

    shareRoutineMutation.mutate(requestBody)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t.common.copied,
        description: `${type} ${t.common.linkCopiedDescription}`
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const resetDialog = () => {
    setShareData(null)
    setQrCodeUrl('')
    setHasExpiration(false)
    setHasMaxUses(false)
    setExpirationDays(30)
    setMaxUses(10)
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            {t.common.share}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.sharing.shareRoutine.title.replace('{routineName}', routineName)}</DialogTitle>
        </DialogHeader>
        
        {!shareData ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="expiration"
                  checked={hasExpiration}
                  onCheckedChange={setHasExpiration}
                />
                <Label htmlFor="expiration" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t.sharing.shareRoutine.setExpiration}
                </Label>
              </div>
              
              {!hasExpiration && (
                <p className="ml-6 text-sm text-muted-foreground">
                  {t.sharing.shareRoutine.neverExpires}
                </p>
              )}
              
              {hasExpiration && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="expiration-days">{t.sharing.shareRoutine.daysToExpire}</Label>
                  <Select 
                    value={expirationDays.toString()} 
                    onValueChange={(value) => setExpirationDays(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">{t.sharing.shareRoutine.days['7']}</SelectItem>
                      <SelectItem value="14">{t.sharing.shareRoutine.days['14']}</SelectItem>
                      <SelectItem value="30">{t.sharing.shareRoutine.days['30']}</SelectItem>
                      <SelectItem value="60">{t.sharing.shareRoutine.days['60']}</SelectItem>
                      <SelectItem value="90">{t.sharing.shareRoutine.days['90']}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="max-uses"
                  checked={hasMaxUses}
                  onCheckedChange={setHasMaxUses}
                />
                <Label htmlFor="max-uses" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {t.sharing.shareRoutine.setMaxUses}
                </Label>
              </div>
              
              {!hasMaxUses && (
                <p className="ml-6 text-sm text-muted-foreground">
                  {t.sharing.shareRoutine.unlimitedUse}
                </p>
              )}
              
              {hasMaxUses && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="max-uses-input">{t.sharing.shareRoutine.maxUses}</Label>
                  <Select 
                    value={maxUses.toString()} 
                    onValueChange={(value) => setMaxUses(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">{t.sharing.shareRoutine.uses['5']}</SelectItem>
                      <SelectItem value="10">{t.sharing.shareRoutine.uses['10']}</SelectItem>
                      <SelectItem value="25">{t.sharing.shareRoutine.uses['25']}</SelectItem>
                      <SelectItem value="50">{t.sharing.shareRoutine.uses['50']}</SelectItem>
                      <SelectItem value="100">{t.sharing.shareRoutine.uses['100']}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              onClick={handleShare} 
              className="w-full"
              disabled={shareRoutineMutation.isPending}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {shareRoutineMutation.isPending ? t.sharing.shareRoutine.sharing : t.sharing.shareRoutine.shareRoutineButton}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t.sharing.shareRoutine.routineShared}</h3>
              <p className="text-sm text-muted-foreground">
                {t.sharing.shareRoutine.shareDescription}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.sharing.shareRoutine.routineCode}</Label>
                <div className="flex space-x-2">
                  <Input
                    value={shareData.sharedRoutine.shareCode}
                    readOnly
                    className="font-mono text-center text-lg font-bold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareData.sharedRoutine.shareCode, t.common.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.sharing.shareRoutine.directLink}</Label>
                <div className="flex space-x-2">
                  <Input
                    value={shareData.shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareData.shareUrl, t.common.link)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="text-center space-y-2">
                  <Label>{t.sharing.shareRoutine.qrCode}</Label>
                  <div className="flex justify-center">
                    <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} className="border rounded" />
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              {hasExpiration && (
                <p>• {t.sharing.shareRoutine.expiresIn.replace('{days}', expirationDays.toString())}</p>
              )}
              {!hasExpiration && (
                <p>• {t.sharing.shareRoutine.noExpiration}</p>
              )}
              {hasMaxUses && (
                <p>• {t.sharing.shareRoutine.maxUsesLimit.replace('{uses}', maxUses.toString())}</p>
              )}
              {!hasMaxUses && (
                <p>• {t.sharing.shareRoutine.unlimitedUses}</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 