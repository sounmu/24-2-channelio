import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
} from 'react'
import {
  VStack,
  HStack,
  Button,
  Text,
  Icon,
  ButtonGroup,
  TextField,
  TextFieldRef,
} from '@channel.io/bezier-react'
import { CancelIcon, SendIcon } from '@channel.io/bezier-icons'
import {
  callFunction,
  callNativeFunction,
  getWamData,
  setSize,
} from '../../utils/wam'
import * as Styled from './Send.styled'

function Send() {
  useEffect(() => {
    setSize(390, 172)
  }, [])

  const chatTitle = useMemo(() => getWamData('chatTitle') ?? '', [])

  const appId = useMemo(() => getWamData('appId') ?? '', [])
  const channelId = useMemo(() => getWamData('channelId') ?? '', [])
  const managerId = useMemo(() => getWamData('managerId') ?? '', [])
  const message = useMemo(() => getWamData('message') ?? '', [])
  const chatId = useMemo(() => getWamData('chatId') ?? '', [])
  const chatType = useMemo(() => getWamData('chatType') ?? '', [])
  const broadcast = useMemo(() => Boolean(getWamData('broadcast') ?? false), [])
  const rootMessageId = useMemo(() => getWamData('rootMessageId'), [])

  const [inputNum, setinputNum] = useState<number>(1)
  const inputRef = useRef<TextFieldRef | null>(null)

  const [option, setOption] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState('1')
  const [hasError, setHasError] = useState<boolean>(false)

  const handleChangeValue = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (
        Number(event.currentTarget.value) < 1 ||
        Number(event.currentTarget.value) > 30
      ) {
        setHasError(true)
      } else {
        setHasError(false)
      }
      setinputNum(Number(event.currentTarget.value))
      event.preventDefault()
    },
    []
  )

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value)
  }

  const getTimeStamp = useCallback(() => {
    const millisecondsInADay = 24 * 60 * 60 * 1000 // 하루의 밀리초
    const endValue = Date.now()
    const startValue = endValue - millisecondsInADay * Number(selectedOption)

    return [startValue, endValue]
  }, [selectedOption])

  const handleOnClick = async () => {
    await handleSend('summarizeN')
    close()
  }

  const handleSend = useCallback(
    async (sender: string): Promise<void> => {
      if (chatType === 'group') {
        switch (sender) {
          case 'bot':
            await callFunction(appId, 'sendAsBot', {
              input: {
                groupId: chatId,
                broadcast,
                rootMessageId,
              },
            })
            break
          case 'manager':
            await callNativeFunction('writeGroupMessageAsManager', {
              channelId,
              groupId: chatId,
              rootMessageId,
              broadcast,
              dto: {
                plainText: message,
                managerId,
              },
            })
            break
          case 'hello':
            await callFunction(appId, 'hello', {
              input: {
                groupId: chatId,
                broadcast,
                rootMessageId,
              },
            })
            break
          case 'summarizeN':
            await callFunction(appId, 'summarize', {
              input: {
                groupId: chatId,
                personId: managerId,
                flag: 0,
                mesgNum: inputNum,
              },
            })
            break
          case 'summarizeD':
            await callFunction(appId, 'summarize', {
              input: {
                groupId: chatId,
                personId: managerId,
                flag: 1,
                startTime: getTimeStamp()[0],
                endTime: getTimeStamp()[1],
              },
            })
            break
          default:
            // NOTE: should not reach here
            console.error('Invalid message sender')
        }
      } else if (chatType === 'directChat') {
        // FIXME: Implement
      } else if (chatType === 'userChat') {
        // FIXME: Implement
      }
    },
    [
      appId,
      broadcast,
      channelId,
      chatId,
      chatType,
      managerId,
      message,
      inputNum,
      rootMessageId,
      getTimeStamp,
    ]
  )

  return (
    <VStack spacing={16}>
      <HStack justify="between">
        <Text
          color="txt-black-darkest"
          typo="24"
          bold
        >
          Summarize
        </Text>
        <Button
          colorVariant="monochrome-dark"
          styleVariant="tertiary"
          leftContent={CancelIcon}
          onClick={() => close()}
        />
      </HStack>
      {option === 0 ? (
        <HStack justify="center">
          <ButtonGroup>
            <Button
              colorVariant="blue"
              styleVariant="primary"
              text="최신 N개 메시지 요약"
              onClick={() => setOption(1)}
            />
            <Button
              colorVariant="blue"
              styleVariant="primary"
              text="시작 일시부터 지금까지 메시지 요약"
              onClick={() => setOption(2)}
            />
          </ButtonGroup>
        </HStack>
      ) : option === 1 ? (
        <HStack>
          <TextField
            ref={inputRef}
            value={inputNum}
            allowClear
            autoFocus
            placeholder="숫자를 입력하세요"
            size="m"
            type="number"
            variant="primary"
            onChange={handleChangeValue}
            hasError={hasError}
          />
          <Button
            colorVariant="blue"
            styleVariant="primary"
            text="요약"
            type="submit"
            onClick={handleOnClick}
            disabled={hasError}
          />
        </HStack>
      ) : option === 2 ? (
        <HStack>
          <select
            value={selectedOption}
            onChange={handleSelectChange}
          >
            <option
              value="1"
              selected
            >
              24시간 전
            </option>
            <option value="3">3일 전</option>
            <option value="5">5일 전</option>
            <option value="7">7일 전</option>
          </select>
          <Button
            colorVariant="blue"
            styleVariant="primary"
            text="요약"
            onClick={async () => {
              await handleSend('summarizeD')
              close()
            }}
          />
        </HStack>
      ) : null}
      <HStack justify="center">
        <Styled.CenterTextWrapper>
          <Icon
            source={SendIcon}
            color="txt-black-dark"
            size="xs"
          />
          <Text
            as="span"
            color="txt-black-dark"
          >
            {chatTitle}
          </Text>
        </Styled.CenterTextWrapper>
      </HStack>
    </VStack>
  )
}

export default Send
